import jwt from "jsonwebtoken"


export const socketMiddleware = (socket,next)=>{
    
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.split(' ')[1]
    if(!token){
        return next(new Error("Authentication failed"))
    }
    try {
        const decode = jwt.verify(token , process.env.JWT_SECRET)
        socket.user = decode
        next()
    } catch (error) {
        return res.json({success:false , message:error.message})
    }
}