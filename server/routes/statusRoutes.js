import express from "express"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { multerMiddleare } from "../config/cloudinary.js"
import { createStatus, deleteStatus, getStatus, viewStatus } from "../controllers/statusController.js"
const statusRouter = express.Router()

statusRouter.post("/" , authMiddleware , multerMiddleare, createStatus)
statusRouter.get("/" , authMiddleware , getStatus)
statusRouter.put("/:statusId/view" , authMiddleware , viewStatus)
statusRouter.delete("/:statusId" , authMiddleware , deleteStatus)

export default statusRouter