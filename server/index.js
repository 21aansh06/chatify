import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import "dotenv/config";
import {createServer} from "node:http"
import connectDB from "./config/conectDB.js";
import authRouter from "./routes/authRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import { initializeSocket } from "./services/socketService.js";
import statusRouter from "./routes/statusRoutes.js";
connectDB()

const allowedOrigins = ["http://localhost:5173"]
const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors({credentials: true , origin: allowedOrigins}))

const server = createServer(app)
const io = initializeSocket(server)

app.use((req,res,next)=>{
    req.io = io
    req.socketUserMap = io.socketUserMap
    next()
})

const port = process.env.PORT || 3000;
app.use("/api/auth" , authRouter)
app.use("/api/chats" , chatRouter)
app.use("/api/status" , statusRouter)

app.get("/", (req,res)=>{
    res.json({success:true , message:"Working"})
})
server.listen(port , ()=>{
    console.log(`Server started on PORT: ${port}` )
})

  

//for TS
// "scripts": {
//     "start": "node dist/index.js",
//     "build":"tsc",
//     "dev": "nodemon ts-node index.ts"
//   },