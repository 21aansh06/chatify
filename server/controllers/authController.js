import { updloadFileToCloudinary } from "../config/cloudinary.js"
import User from "../models/User.js"
import { sendOtpToEmail } from "../services/emailService.js"
import { sendOtpToPhn, verifyOtpPhn } from "../services/twilioService.js"
import { generateToken } from "../utils/generateToken.js"
import generateOTP from "../utils/otpGenerator.js"
import Conversation from "../models/Conversation.js"

//send-otp

export const sendOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body
  const otp = generateOTP()
  const expiry = new Date(Date.now() + 5 * 60 * 1000)

  try {
    let user

    // ✅ EMAIL LOGIN / SIGNUP
    if (email) {
      user = await User.findOne({ email })

      if (!user) {
        user = new User({ email })
      }

      user.emailOtp = otp
      user.emailOtpExpire = expiry

      await user.save()
      await sendOtpToEmail(email, otp)

      return res.json({
        success: true,
        message: "OTP sent to your email"
      })
    }

    // ✅ PHONE LOGIN / SIGNUP
    if (!phoneNumber || !phoneSuffix) {
      return res.json({
        success: false,
        message: "Provide phone number and country code"
      })
    }

    const fullPhoneNum = `${phoneSuffix}${phoneNumber}`

    user = await User.findOne({ phoneNumber, phoneSuffix })

    if (!user) {
      user = new User({ phoneNumber, phoneSuffix })
    }

    user.phoneOtp = otp
    user.phoneOtpExpire = expiry

    await user.save()
    await sendOtpToPhn(fullPhoneNum, otp)

    return res.json({
      success: true,
      message: "OTP sent to your phone number"
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}


export const verifyOtp = async (req, res) => {
    const { phoneNumber, phoneSuffix, email, otp } = req.body
    if (!otp) {
        return res.json({ success: false, message: "hnji" })
    }
    try {

        let user;
        if (email) {
            user = await User.findOne({ email })
            if (!user) {
                return res.json({ success: false, message: "User not found" })
            }

            const now = new Date()

            if (
                !user.emailOtp ||
                String(user.emailOtp) !== String(otp) ||
                now > new Date(user.emailOtpExpire)
            ) {
                return res.json({ success: false, message: "Invalid or expired otp" })
            }

            user.isVerified = true
            user.emailOtp = null
            user.emailOtpExpire = null
            await user.save()
        }
        else {
            if (!phoneNumber || !phoneSuffix) {
                return res.json({ success: false, message: "Provide details" })
            }

            const fullPhoneNum = `${phoneSuffix}${phoneNumber}`
            user = await User.findOne({ phoneNumber })
            if (!user) {
                return res.json({ success: false, message: "User not found" })
            }

            const result = await verifyOtpPhn(fullPhoneNum, otp)

            if (result.status !== "approved") {
                return res.json({ success: false, message: "Invalid otp" })
            }

            user.isVerified = true
            await user.save()
        }

        // TOKEN
        const token = generateToken(user?._id)
        res.cookie("auth_token", token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365
        })

        return res.json({ success: true, message: "Otp verified successfully", token, user })

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
export const updateProfile = async (req, res) => {
    const { username, agreed, about } = req.body
    const userId = req.user.userId
    try {
        const user = await User.findById(userId)
        if (!user) { }
        const file = req.file
        console.log(file)
        if (file) {
            const uploadResult = await updloadFileToCloudinary(file)
            user.profilePic = uploadResult?.secure_url
        } else if (req.body.media) {
            user.profilePic = req.body.media
        }
        if (username) user.username = username
        if (agreed) user.isAgreed = agreed === "true" || agreed === "on" || agreed === true;
        if (about) user.about = about
        await user.save()
        return res.json({ success: true, message: "Profile updated", user })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }

}
export const checkAuthenticate = async (req, res) => {
    try {
        const userId = req.user.userId
        if (!userId) {
            return res.json({ success: false, message: "Unauthorized" })
        }
        const user = await User.findById(userId)
        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }
        return res.json({ success: true, user })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

export const logout = async (req, res) => {
    try {
        res.cookie("auth_token", "", { expires: new Date(0) })
        return res.json({ success: true, message: "Logged out" })
    } catch (error) {
        return res.json({ success: false, message: error.message })

    }
}

export const getAllUsers = async (req, res) => {
    const loggedUser = req.user.userId
    try {
        const users = await User.find({ _id: { $ne: loggedUser } }).select(
            "username profilePic isAgreed about lastSeen isOnline isVerified"
        ).lean()
        const usersWithConversation = await Promise.all(
            users?.map(async (user) => {
                const conversation = await Conversation.findOne({
                    participants: { $all: [loggedUser, user?._id] }
                }).populate({
                    path: "lastMessage",
                    select: "sender reciever content createdAt"
                }).lean()
                return {
                    ...user,
                    conversation: conversation || null
                }
            })
        )
        return res.json({ success: true, usersWithConversation })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}