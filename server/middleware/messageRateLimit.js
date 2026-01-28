import redis from "../config/redis.js";

const WINDOW_SECONDS = 60
const MAX_MESSAGES = 30

export const messageRateLimit = async (req, res, next) => {
  try {
    const senderId = req.user.userId

    const key = `msg:${senderId}`

    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, WINDOW_SECONDS)
    }

    if (current > MAX_MESSAGES) {
      return res.status(429).json({
        success: false,
        message: "Too many messages.Slow down."
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
