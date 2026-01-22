import Conversation from "../models/Conversation.js"
import redis from "../config/redis.js";

const WINDOW_SECONDS = 10
const MAX_MESSAGES = 7

export const messageRateLimit = async (req, res, next) => {
  try {
    const senderId = req.user.userId
    const receiverId = req.query.recieverId

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID required"
      })
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    }).select("_id")

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      })
    }

    const conversationId = conversation._id.toString()

    const key = `msg:${senderId}:${conversationId}`

    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, WINDOW_SECONDS)
    }

    if (current > MAX_MESSAGES) {
      return res.status(429).json({
        success: false,
        message: "Too many messages. Slow down."
      })
    }


    next()
  } catch (error) {
    console.error("Rate limit error:", error)
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}
