import express from "express"
import { checkAuthenticate, getAllUsers, logout, sendOtp, updateProfile, verifyOtp } from "../controllers/authController.js"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { multerMiddleare } from "../config/cloudinary.js"

const authRouter = express.Router()

authRouter.post("/send-otp" , sendOtp)
authRouter.post("/verify-otp" , verifyOtp)

authRouter.put("/update-profile" , authMiddleware , multerMiddleare, updateProfile)
authRouter.get("/logout" ,  logout)
authRouter.get("/check-auth" , authMiddleware , checkAuthenticate)
authRouter.get("/users" , authMiddleware , getAllUsers)

export default authRouter