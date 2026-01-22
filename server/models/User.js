import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    phoneSuffix: {
        type: String,
        unique: false
    },
    username: {
        type: String
    },
    email: {
        type: String,
        unique: true,
        lowercase: true
    },
    emailOtp: {
        type: String
    },
    emailOtpExpire: {
        type: Date
    },
    profilePic: {
        type: String
    },
    about: {
        type: String
    },
    lastSeen: {
        type: Date
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isAgreed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const User = mongoose.model("User", userSchema)

export default User