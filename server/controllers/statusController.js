import Status from "../models/Status.js";
import Message from "../models/Message.js";




export const createStatus = async (req, res) => {
    try {
        const { content, contentType } = req.body;
        const userId = req.user.userId
        const file = req.file;

        const mediaUrl = null
        let finalContentType = contentType || "text"

        if (file) {
            const uploadFile = await updloadFileToCloudinary(file);
            if (!uploadFile?.secure_url) {
                return res.json({ success: false, message: "Failed to upload media" });
            }
            mediaUrl = uploadFile.secure_url;

            if (file.mimetype.startsWith("image")) {
                finalContentType = "image";
            } else if (file.mimetype.startsWith("video")) {
                finalContentType = "video";
            } else {
                return res.json({ success: false, message: "Unsupported file type" });
            }
        } else if (content?.trim()) {
            finalContentType = "text";
        } else {
            return res.json({ success: false, message: "Message required" });
        }

        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24)

        const status = new Status({
            user: userId,
            content: mediaUrl || content,
            contentType: finalContentType,
            expiresAt
        })
        await status.save()
        const populateStatus = await Status.findOne(status?._id)
            .populate("user", "username profilePic")
            .populate("viewers", "username profilePic")

        if (req.io && req.socketUserMap) {
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
                    req.io.to(socketId).emit("new_status", populateStatus)
                }
            }
        }

        return res.json({ success: true, message: "Status created successfully", populateStatus });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const getStatus = async (req, res) => {
    try {
        const status = await Status.find({
            expiresAt: { $gt: new Date() }
        }).populate("user", "username profilePic")
            .populate("viewers", "username profilePic")

        return res.json({ success: true, message: "Staus", status })
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const viewStatus = async (req, res) => {
    try {
        const { statusId } = req.params
        const userId = req.user.userId
        const status = await Status.findById(statusId)
        if (!status) {
            return res.json({ success: false, message: "No status found" })
        }
        if (!status.viewers.includes(userId)) {
            status.viewers.push(userId)
            await status.save()

            const updatedStatus = await Status.findById(statusId)
                .populate("user", "username profilePic")
                .populate("viewers", "username profilePic")

            if (req.io && req.socketUserMap) {
                const statusOwnerSocketId = req.socketUserMap.get(status.user._id)
                if (statusOwnerSocketId) {
                    const viewData = {
                        statusId,
                        viewerId: userId,
                        viewers: updatedStatus.viewers,
                        totalViewers: updatedStatus.viewers.length
                    }
                    req.io.to(statusOwnerSocketId).emit("status_viewed", viewData)
                } else {
                    console.log("owner doesnt connected");

                }
            }

        } else {
            console.log("viewed already");
        }

        return res.json({ success: true, message: "Status viewed" })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

export const deleteStatus = async (req, res) => {
    try {
        const userId = req.user.userId
        const { statusId } = req.params
        const status = await Status.findById(statusId)
        if (!status) {
            return res.json({ success: false, message: "No status found" })
        }
        if (status.user.toString() !== userId) {
            return res.json({ success: false, message: "You can't delete this status" })
        }
        await status.deleteOne()

        if (req.io && req.socketUserMap) {
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
                    req.io.to(socketId).emit("status_deleted", statusId)
                }
            }
        }
        return res.json({ success: true, message: "Status deleted successfully" })
    } catch (error) {
        return res.json({ success: false, message: error.message })

    }
}