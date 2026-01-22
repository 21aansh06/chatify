import jwt from "jsonwebtoken"


export const authMiddleware = (req,res,next)=>{
    const authHeader = req.headers['authorization']
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.json({success:false , message:"Access denied"})
    }
    const token = authHeader.split(' ')[1]
    try {
        const decode = jwt.verify(token , process.env.JWT_SECRET)
        req.user = decode
        next()
    } catch (error) {
        return res.json({success:false , message:error.message})
    }
}