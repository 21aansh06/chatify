import { create } from "zustand"
import { getSocket } from "../services/chat"
import axiosInstance from "../services/url"
export const chatStore = create((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    cursor: null,
    hasMore: true,
    loading: false,
    loadingMore: false,
    error: null,
    onlineUsers: new Map(),
    typingUsers: new Map(),


    initsocketListeners: () => {
        const socket = getSocket()
        if (!socket) return


        socket.off("recieve_message")
        socket.off("message_recieved")
        socket.off("user_typing")
        socket.off("user_status")
        socket.off("message_error")
        socket.off("message_send")
        socket.off("message_deleted")



        socket.on("message_recieved", (message) => {
            get().recieveMessage(message)
        })

        socket.on("message_status_update", ({ messageId, messageStatus }) => {
            console.log("status", messageStatus)
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, messageStatus } : msg)
            }))
        })

        socket.on("reaction_update", ({ messageId, reactions }) => {
            set((state) => {
                const updatedMessages = state.messages.map((msg) => {
                    const msgId = msg._id?.toString() || msg._id
                    const reactionMsgId = messageId?.toString() || messageId
                    if (msgId === reactionMsgId) {
                        console.log("Updating message reactions:", msgId, reactions)
                        return { ...msg, reactions: reactions || [] }
                    }
                    return msg
                })
                return { messages: updatedMessages }
            })
        })

        socket.on("message_error", (error) => {
            console.log("error", error);
        })

        socket.on("reaction_error", (error) => {
            console.error("Reaction error:", error);
        })

        socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
            set((state) => {
                const newTypingUsers = new Map(state.typingUsers)

                if (!newTypingUsers.has(conversationId)) {
                    newTypingUsers.set(conversationId, new Set())
                }

                const typingSet = newTypingUsers.get(conversationId)

                if (isTyping) {
                    typingSet.add(userId)
                } else {
                    typingSet.delete(userId)
                }

                return { typingUsers: newTypingUsers }
            })
        })

        socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
            if (!userId) return
            const userIdStr = userId?.toString() || userId
            set((state) => {
                const newOnlineUsers = new Map(state.onlineUsers)
                newOnlineUsers.set(userIdStr, {
                    isOnline: isOnline || false,
                    lastSeen: lastSeen || null
                })
                return { onlineUsers: newOnlineUsers }
            })
        })

        const { conversations, currentUser } = get()
        const conversationsArray = Array.isArray(conversations) ? conversations : (conversations?.data || [])

        if (conversationsArray.length > 0 && currentUser?._id) {
            conversationsArray.forEach((conv) => {
                const otherUser = conv.participants?.find(
                    (p) => p._id?.toString() !== currentUser._id?.toString()
                )

                if (otherUser?._id) {
                    const userIdToCheck = otherUser._id?.toString() || otherUser._id
                    socket.emit("get_user_status", userIdToCheck, (status) => {
                        if (status && status.userId) {
                            set((state) => {
                                const newOnlineUsers = new Map(state.onlineUsers)
                                newOnlineUsers.set(status.userId, {
                                    isOnline: status.isOnline || false,
                                    lastSeen: status.lastSeen || null
                                })
                                return { onlineUsers: newOnlineUsers }
                            })
                        }
                    })
                }
            })
        }

    },


    setCurrentUser: (user) => set({ currentUser: user }),

    fetchConversations: async () => {
        set({ loading: true, error: null })
        try {
            const { data } = await axiosInstance.get("/chats/conversations")
            const conversationsArray = data.conversation || []

            // Initialize online users status from conversations
            const { currentUser } = get()
            const newOnlineUsers = new Map()

            conversationsArray.forEach((conv) => {
                if (conv.participants && Array.isArray(conv.participants)) {
                    conv.participants.forEach((participant) => {
                        const participantId = participant._id?.toString() || participant._id
                        if (participantId && participantId !== currentUser?._id?.toString()) {
                            newOnlineUsers.set(participantId, {
                                isOnline: participant.isOnline || false,
                                lastSeen: participant.lastSeen || null
                            })
                        }
                    })
                }
            })

            set({
                conversations: conversationsArray,
                loading: false,
                onlineUsers: newOnlineUsers
            })

            get().initsocketListeners()
            return data
        } catch (error) {
            set({ error: error?.message || "error ocurred", loading: false })
        }
        return null
    },

    fetchMessages: async (conversationId) => {
        // console.log(conversationId)
        if (!conversationId) return
        set({
            loading: true,
            error: null,
            messages: [],
            cursor: null,
            hasMore: true
        })
        try {
            const { data } = await axiosInstance.get(`/chats/conversations/${conversationId}/messages`)

            const messageArray = data.messages || [] || data
            set({
                messages: messageArray,
                currentConversation: conversationId,
                cursor: data.nextCursor,
                hasMore: data.hasMore,
                loading: false
            })

            const { markMessageAsRead } = get()
            markMessageAsRead()
            return messageArray
        } catch (error) {
            set({ error: error?.message || "error ocurred", loading: false })

        }
        return []
    },
    fetchMoreMessages: async () => {
        const { cursor, hasMore, loadingMore, currentConversation } = get()
        // console.log(currentConversation)
        // console.log(cursor)

        if (!currentConversation || !hasMore || loadingMore) return

        set({ loadingMore: true })
        try {
            const { data } = await axiosInstance.get(`/chats/conversations/${currentConversation}/messages`, {
                params: {
                    cursor
                }
            })


            set((state) => ({
                messages: [...data.messages, ...state.messages],
                cursor: data.nextCursor,
                hasMore: data.hasMore,
                loadingMore: false
            }))
        } catch (error) {
            set({ loadingMore: false })
        }

    },

    sendMessage: async (formData) => {
        const senderId = formData.get("senderId")
        const recieverId = formData.get("recieverId")
        const media = formData.get("media")
        const content = formData.get("content")
        const messageStatus = formData.get("messageStatus")
        const socket = getSocket()
        const { conversations } = get()
        let conversationId = null
        if (conversations?.data?.length > 0) {
            const conversation = conversations.data.find((conv) =>
                conv.participants.some((p) => p._id === senderId) &&
                conv.participants.some((p) => p._id === recieverId))

            if (conversation) {
                conversationId = conversation._id
                set({ currentConversation: conversationId })
            }
        }
        const tempId = `temp-${Date.now()}`
        const sampleMessage = {
            _id: tempId,
            sender: { _id: senderId },
            reciever: { _id: recieverId },
            conversation: conversationId,
            imageOrVideoUrl: media && typeof media !== 'string' ? URL.createObjectURL(media) : null,
            content: content,
            contentType: media ? media.type.startsWith("image") ? "image" : "video" : "text",
            createdAt: new Date().toISOString(),
            messageStatus
        }

        set((state) => ({
            messages: [...state.messages, sampleMessage]
        }))

        try {
            const { data } = await axiosInstance.post(
                "/chats/send-message",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            )

            const messageData = data.populateMessage || data
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === tempId ? messageData : msg)
            }))

            return messageData
        } catch (error) {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === tempId ? { ...msg, messageStatus: "failed" } : msg),
                error: error?.message || "failed to send message"
            }))
            throw error
        }
    },

    recieveMessage: (message) => {
        if (!message) return

        const { currentConversation, currentUser, messages, conversations } = get()

        // Check if message already exists to prevent duplicates
        const messageExists = messages.some((msg) => msg._id === message._id)
        if (messageExists) return

        // Only add message if it belongs to current conversation OR update conversations list
        if (message.conversation?.toString() === currentConversation?.toString()) {
            set((state) => ({
                messages: [...state.messages, message]
            }))

            if (message.reciever?._id === currentUser?._id) {
                get().markMessageAsRead()
            }
        }

        // Update conversations list to show new message
        const conversationsArray = conversations?.data || conversations || []
        if (Array.isArray(conversationsArray)) {
            set((state) => {
                const updatedConversations = conversationsArray.map((conv) => {
                    if (conv._id?.toString() === message.conversation?.toString()) {
                        return {
                            ...conv,
                            lastMessage: message,
                            unreadCount: message?.reciever?._id === currentUser?._id
                                ? (conv.unreadCount || 0) + 1
                                : conv.unreadCount || 0
                        }
                    }
                    return conv
                })

                // If conversation structure has data property, update it
                if (state.conversations?.data) {
                    return {
                        conversations: {
                            ...state.conversations,
                            data: updatedConversations
                        }
                    }
                } else {
                    return {
                        conversations: updatedConversations
                    }
                }
            })
        }
    },

    markMessageAsRead: async () => {
        const { messages, currentUser } = get()

        if (!messages.length || !currentUser) return
        const unreadIds = messages.filter((msg) => msg.messageStatus !== "read" && msg.reciever?._id === currentUser._id).map((msg) => msg._id).filter(Boolean)

        if (unreadIds.length === 0) return

        try {
            const { data } = await axiosInstance.put("/chats/messages/read", {
                messageIds: unreadIds
            })

            set((state) => ({
                messages: state.messages.map((msg) =>
                    unreadIds.includes(msg._id) ? { ...msg, messageStatus: "read" } : msg)
            }))
            const socket = getSocket()
            if (socket && messages[0]?.sender?._id) {
                socket.emit("message_read", unreadIds, messages[0].sender._id)
            }
        } catch (error) {

        }
    },

    deleteMessage: async (messageId) => {
        try {
            await axiosInstance.delete(`/chats/messages/${messageId}`)
            set((state) => ({
                messages: state.messages?.filter((msg) => msg?._id !== messageId)
            }))
            return true
        } catch (error) {
            set({ error: error?.message || "error ocurred" })
            return false
        }
    },
    addReaction: async (messageId, emoji) => {
        const socket = getSocket()
        const { currentUser } = get()

        if (!socket) {
            console.error("Socket not available for adding reaction")
            return
        }

        if (!currentUser?._id) {
            console.error("Current user not available for adding reaction")
            return
        }

        if (!messageId || !emoji) {
            console.error("Missing messageId or emoji for reaction")
            return
        }

        console.log("Emitting add_reaction:", { messageId, emoji, userId: currentUser._id })

        socket.emit("add_reaction", {
            messageId,
            emoji,
            userId: currentUser._id
        })
    },
    startTyping: (recieverId) => {
        const { currentConversation } = get()
        const socket = getSocket()

        if (socket && currentConversation && recieverId) {
            socket.emit("typing_start", {
                conversationId: currentConversation,
                recieverId
            })
        }
    },
    stopTyping: (recieverId) => {
        const { currentConversation } = get()
        const socket = getSocket()
        if (socket && currentConversation && recieverId) {
            socket.emit("typing-stop", {
                conversationId: currentConversation,
                recieverId
            })
        }
    },

    isUserTyping: (userId) => {
        const { typingUsers, currentConversation } = get()
        if (!currentConversation || !typingUsers.has(currentConversation) || !userId) {
            return false
        }
        return typingUsers.get(currentConversation).has(userId)
    },

    isUserOnline: (userId) => {
        if (!userId) return false
        const { onlineUsers } = get()
        const userIdStr = userId?.toString() || userId
        return onlineUsers.get(userIdStr)?.isOnline || false
    },

    getUserLastSeen: (userId) => {
        if (!userId) return null
        const { onlineUsers } = get()
        const userIdStr = userId?.toString() || userId
        return onlineUsers.get(userIdStr)?.lastSeen || null
    },

    cleanup: () => {
        set({
            conversations: [],
            currentConversation: null,
            messages: [],
            onlineUsers: new Map(),
            typingUsers: new Map()
        })
    }

}))