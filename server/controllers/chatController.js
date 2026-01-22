import { updloadFileToCloudinary } from "../config/cloudinary.js"
import Conversation from "../models/Conversation.js"
import Message from "../models/Message.js"

export const sendMessage = async (req, res) => {
    try {
        const { senderId, recieverId, content, messageStatus } = req.body;
        const file = req.file;
        const participants = [senderId, recieverId].sort();

        let conversation = await Conversation.findOne({ participants });
        if (!conversation) {
            conversation = new Conversation({ participants });
            await conversation.save();
        }

        let imageURL = null;
        let contentType = null;

        if (file) {
            const uploadFile = await updloadFileToCloudinary(file);
            if (!uploadFile?.secure_url) {
                return res.json({ success: false, message: "Failed to upload media" });
            }
            imageURL = uploadFile.secure_url;

            if (file.mimetype.startsWith("image")) {
                contentType = "image";
            } else if (file.mimetype.startsWith("video")) {
                contentType = "video";
            } else {
                return res.json({ success: false, message: "Unsupported file type" });
            }
        } else if (content?.trim()) {
            contentType = "text";
        } else {
            return res.json({ success: false, message: "Message required" });
        }

        const message = new Message({
            conversation: conversation._id,
            sender: senderId,
            reciever: recieverId,
            content,
            imageURL,
            contentType,
            messageStatus
        });

        await message.save();

        if (message?.content) {
            conversation.lastMessage = message._id;
        }

        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        await conversation.save();

        const populateMessage = await Message.findById(message._id)
            .populate("sender", "username profilePic")
            .populate("reciever", "username profilePic");

        if (req.io && req.socketUserMap) {
            const recieverSocketId = req.socketUserMap.get(recieverId.toString())
            const senderSocketId = req.socketUserMap.get(senderId.toString())

            // Emit to receiver
            if (recieverSocketId) {
                req.io.to(recieverSocketId).emit("message_recieved", populateMessage)
                message.messageStatus = "delivered"
                await message.save()
            }

            // Also update sender's message status if receiver is online
            if (senderSocketId && recieverSocketId) {
                req.io.to(senderSocketId).emit("message_status_update", {
                    messageId: message._id,
                    messageStatus: "delivered"
                })
            }
        }

        return res.json({ success: true, message: "Message sent successfully", populateMessage });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const getAllConversations = async (req, res) => {
    try {
        const userId = req.user.userId

        let conversation = await Conversation.find({ participants: userId })
            .populate("participants", "username profilePic isOnline lastSeen")
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender reciever",
                    select: "username profilePic"
                }
            }).sort({ updatedAt: -1 })
        return res.json({ success: true, message: "Conversation got successfully", conversation })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

export const getConversation = async (req, res) => {
    try {
        const userId = req.user.userId
        const { conversationId } = req.params
        const { cursor } = req.query


        const conversation = await Conversation.findById(conversationId)
        if (!conversation) {
            return res.json({ success: false, message: "Conversation not found" })
        }

        if (!conversation.participants.includes(userId)) {
            return res.json({ success: false, message: "Not authorized" })
        }

        const limit = 20
        const query = { conversation: conversationId }

        if (cursor) {
            query._id = { $lt: cursor }
        }

        const messages = await Message.find(query)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .populate("sender", "username profilePic")
            .populate("reciever", "username profilePic")

        let hasMore = false
        if (messages.length > limit) {
            hasMore = true
            messages.pop()
        }

        const nextCursor =
            messages.length > 0 ? messages[messages.length - 1]._id : null

        await Message.updateMany(
            {
                conversation: conversationId,
                reciever: userId,
                messageStatus: { $in: ["send", "delivered"] }
            },
            { $set: { messageStatus: "read" } }
        )

        conversation.unreadCount = 0
        await conversation.save()
        messages.reverse()

        return res.json({
            success: true,
            message: "Messages retrieved",
            messages,
            nextCursor,
            hasMore
        })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}


export const markAsRead = async (req, res) => {
    try {
        const userId = req.user.userId
        const { messagesId } = req.body
        const messages = await Message.find({
            _id: { $in: messagesId },
            reciever: userId
        })
        await Message.updateMany({
            _id: { $in: messagesId },
            reciever: userId
        }, { $set: { messageStatus: "read" } })
        if (req.io && req.socketUserMap) {
            for (const message of messages) {
                const senderSocketId = req.socketUserMap.get(message.sender.toString())
                if (senderSocketId) {
                    req.io.to(senderSocketId).emit("message_status_update", {
                        messageId: message._id,
                        messageStatus: "read"
                    })
                }
            }
        }

        return res.json({ success: true, message: "Marked as read", messages })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}


export const deleteMessage = async (req, res) => {
    try {
        const userId = req.user.userId
        const { messageId } = req.params
        const message = await Message.findById(messageId)
        if (!message) {
            return res.json({ success: false, message: "Message not found" })
        }
        if (message.sender.toString() !== userId) {
            return res.json({ success: false, message: "Unauthorized" })
        }
        await message.deleteOne()
        if (req.io && req.socketUserMap) {
            const recieverSocketId = req.socketUserMap.get(message.reciever)
            if (recieverSocketId) {
                req.io.to(recieverSocketId).emit("message_deleted", messageId)
            }
        }
        return res.json({ success: true, message: "Message deleted" })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}