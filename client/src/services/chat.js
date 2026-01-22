import { io } from "socket.io-client"
import userStore from "../store/userStore"

let socket = null
const token = localStorage.getItem("auth_token")

export const initializeSocket = () => {
    const user = userStore.getState().user

    if (socket && socket.connected) {
        // If socket already exists and is connected, emit user_connected again
        if (user?._id) {
            socket.emit("user_connected", user._id)
        }
        return socket
    }
    
    if (socket) return socket
    
    const BACKEND_URL = import.meta.env.VITE_API_URL

    socket = io(BACKEND_URL, {
        auth:{token},
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    })


    socket.on("connect", () => {
        console.log("socket connected", socket.id);
        if (user?._id) {
            socket.emit("user_connected", user._id)
        }
    })

    socket.on("connect_error", (error) => {
        console.error("socket connection error", error)
    })

    socket.on("disconnect", (reason) => {
        console.log("socket disconnected", reason);

    })


    return socket
}

export const getSocket = () => {
    if (!socket) return initializeSocket()
    if (socket) return socket
}

export const diconnectSocket = ()=>{
    if(socket){
        socket.disconnect()
        socket = null
    }
}