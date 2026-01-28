import express from "express"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { deleteMessage, getAllConversations, getConversation, markAsRead, sendMessage } from "../controllers/chatController.js"
import { multerMiddleare } from "../config/cloudinary.js"
import { messageRateLimit } from "../middleware/messageRateLimit.js"
const chatRouter = express.Router()

chatRouter.post("/send-message" , authMiddleware , multerMiddleare, messageRateLimit, sendMessage)
chatRouter.get("/conversations" , authMiddleware , getAllConversations)
chatRouter.get("/conversations/:conversationId/messages" , authMiddleware , getConversation)
chatRouter.put("/messages/read" , authMiddleware , markAsRead)
chatRouter.delete("/messages/:messageId" , authMiddleware , deleteMessage)

export default chatRouter