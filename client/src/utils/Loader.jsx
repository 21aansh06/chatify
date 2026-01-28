import React from 'react'
import { motion } from 'framer-motion'
import { LuMessageCircleCode } from "react-icons/lu"
import themeStore from '../store/themeStore'

export default function Loader({ progress = 0 }) {
  const { theme } = themeStore()

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 transition-colors duration-500 ${
      theme === "dark" ? "bg-[#020617]" : "bg-zinc-100"
    }`}>
            <div className="absolute inset-0 z-0">
        <div className={`absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full blur-[120px] mix-blend-screen opacity-70 animate-pulse ${
          theme === "dark" ? "bg-indigo-600" : "bg-indigo-400"
        }`} />
        <div className={`absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full blur-[120px] mix-blend-screen opacity-60 ${
          theme === "dark" ? "bg-blue-600" : "bg-blue-300"
        }`} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative z-10 w-full max-w-md backdrop-blur-[40px] rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border-2 p-12 flex flex-col items-center ${
          theme === "dark" 
            ? "bg-black/30 border-white/10 text-white" 
            : "bg-white/40 border-white/60 text-zinc-900"
        }`}
      >
        {/* Logo Section */}
        <motion.div
          animate={{ 
            rotate: [12, -12, 12],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl mb-8 bg-indigo-600 text-white
          `}
        >
          <LuMessageCircleCode className="w-12 h-12 -rotate-12" />
        </motion.div>

        <h1 className={`text-3xl font-black italic tracking-tighter mb-10 ${
          theme === "dark" ? "text-indigo-400" : "text-indigo-600"
        }`}>
          CHATIFY
        </h1>

        <div className="w-full space-y-4">
          <div className={`w-full h-4 rounded-full overflow-hidden p-[2px] ${
            theme === "dark" ? "bg-zinc-900/80" : "bg-zinc-200"
          }`}>
            <motion.div
              className={`h-full rounded-full ${
                theme === "dark" 
                  ? "bg-gradient-to-r from-indigo-500 to-blue-400 shadow-[0_0_20px_rgba(129,140,248,0.6)]" 
                  : "bg-gradient-to-r from-indigo-600 to-blue-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "circOut" }} 
            />
          </div>

          <div className="flex justify-between items-center px-2">
            <span className={`text-[10px] font-black uppercase tracking-[0.3em] animate-pulse ${
              theme === "dark" ? "text-zinc-500" : "text-zinc-400"
            }`}>
              Establishing Secure Connection
            </span>
            <span className={`text-sm font-black italic ${
              theme === "dark" ? "text-indigo-400" : "text-indigo-600"
            }`}>
              {progress}%
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}