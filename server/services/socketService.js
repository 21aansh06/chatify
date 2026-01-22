import { Server } from "socket.io"
import User from "../models/User.js"
import Message from "../models/Message.js"
import Conversation from "../models/Conversation.js"
import { socketMiddleware } from "../middleware/socketMiddleware.js"

const onlineUsers = new Map()

const typingUsers = new Map()

export const initializeSocket = (server) => {
  const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: false,
      allowedHeaders: ["Authorization"],
    },
    pingTimeout: 60 * 1000,
  });
    io.use(socketMiddleware)

    io.on("connection", (socket) => {
        let userId = null;

        socket.on("user_connected", async (connectingUserId) => {
            try {
                // when user connects
                userId = connectingUserId.toString()
                onlineUsers.set(userId, socket.id)

                socket.join(userId)

                await User.findByIdAndUpdate(userId, {
                    isOnline: true,
                    lastSeen: new Date()
                })

                await Message.updateMany(
                    { reciever: userId, messageStatus: "send" },
                    { $set: { messageStatus: "delivered" } }
                )


                io.emit("user_status", { userId, isOnline: true, lastSeen: null })
            } catch (error) {

            }

        })
        //Return online status

        socket.on("get_user_status", async (requestedUserId, callback) => {
            try {
                const userIdStr = requestedUserId?.toString()
                const isOnline = onlineUsers.has(userIdStr)

                if (isOnline) {
                    callback({
                        userId: userIdStr,
                        isOnline: true,
                        lastSeen: new Date()
                    })
                } else {
                    const user = await User.findById(userIdStr).select("lastSeen isOnline")
                    callback({
                        userId: userIdStr,
                        isOnline: false,
                        lastSeen: user?.lastSeen || null
                    })
                }
            } catch (error) {
                callback({
                    userId: requestedUserId?.toString(),
                    isOnline: false,
                    lastSeen: null
                })
            }
        })

        //forward message to reciever

        socket.on("send_message", async (message) => {
            try {

                // when sending message
                const receiverId = message.reciever?._id?.toString()
                const recieverSocketId = onlineUsers.get(receiverId)
                if (recieverSocketId) {
                    io.to(recieverSocketId).emit("recieve_message", message)
                }
            } catch (error) {

            }
        })
        //update status of messgae
        socket.on("add_reaction", async ({ messageId, emoji, userId }) => {
            try {
                if (!messageId || !emoji || !userId) {
                    socket.emit("reaction_error", { message: "Invalid reaction data" })
                    return
                }

                const userIdStr = userId.toString()
                const messageIdStr = messageId.toString()

                const message = await Message.findById(messageIdStr)

                if (!message) {
                    socket.emit("reaction_error", { message: "Message not found" })
                    return
                }

                if (!Array.isArray(message.reactions)) {
                    message.reactions = []
                }

                const existingReactionIndex = message.reactions.findIndex(
                    (reaction) =>
                        reaction.user?.toString() === userIdStr &&
                        reaction.emoji === emoji
                )

                if (existingReactionIndex !== -1) {
                    message.reactions.splice(existingReactionIndex, 1)
                } else {
                    message.reactions.push({ user: userIdStr, emoji })
                }

                await message.save()

                const conversationId = message.conversation.toString()
                const conversation = await Conversation.findById(conversationId)

                if (!conversation || !conversation.participants?.length) {
                    socket.emit("reaction_error", { message: "Conversation not found" })
                    return
                }

                const populatedMessage = await Message.findById(messageIdStr)
                    .populate("reactions.user", "username profilePic")
                    .select("reactions")
                    .lean()

                const formattedReactions = (populatedMessage?.reactions || []).map(
                    (reaction) => ({
                        user: reaction.user?._id || reaction.user,
                        emoji: reaction.emoji,
                        ...(reaction.user?.username && {
                            userDetails: {
                                username: reaction.user.username,
                                profilePic: reaction.user.profilePic
                            }
                        })
                    })
                )

                conversation.participants.forEach((participantId) => {
                    const socketId = onlineUsers.get(participantId.toString())
                    if (socketId) {
                        io.to(socketId).emit("reaction_update", {
                            messageId: messageIdStr,
                            reactions: formattedReactions
                        })
                    }
                })

            } catch (error) {
                console.error("Error in add_reaction handler:", error)
                console.error(error.stack)
                socket.emit("reaction_error", {
                    message: "Failed to add reaction",
                    error: error.message
                })
            }
        })

        const handleDisconnected = async () => {
            try {
                if (!userId) return

                const userIdStr = userId.toString()
                onlineUsers.delete(userIdStr)

                await User.findByIdAndUpdate(userIdStr, {
                    isOnline: false,
                    lastSeen: new Date()
                })

                io.emit("user_status", {
                    userId: userIdStr,
                    isOnline: false,
                    lastSeen: new Date()
                })

                socket.leave(userIdStr)

            } catch (error) {
                console.error("Error in handleDisconnected:", error)
            }
        }

        socket.on("disconnect", handleDisconnected)

    })
    io.socketUserMap = onlineUsers
    return io
}