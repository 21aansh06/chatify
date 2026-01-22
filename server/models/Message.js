import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    reciever: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String
    },
    imageURL: {
        type: String
    },
    contentType: {
        type: String,
        enum: ["image", "text", "video"]
    },
    reactions: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            emoji: String
        }
    ],
    messageStatus: {
        type: String,
        default: "send",
    }
}, { timestamps: true })

messageSchema.index({ conversation: 1, _id: -1 })

const Message = mongoose.model("Message", messageSchema)
export default Message