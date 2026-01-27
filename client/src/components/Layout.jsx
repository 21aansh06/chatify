import React, { useEffect, useState } from 'react'
import layoutStore from '../store/layoutStore'
import { useLocation } from 'react-router-dom'
import themeStore from '../store/themeStore'
import SideBar from './SideBar'
import { motion, AnimatePresence } from 'framer-motion'
import ChatWindow from '../pages/chatPage/ChatWindow'

const Layout = ({ children, isThemeDialogOpen, toggleThemeDialog, isStatusPreviewOpen, statusPreviewContent }) => {
  const { setSelectedContact, selectedContact } = layoutStore()
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const { theme, setTheme } = themeStore()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className={`min-h-screen flex relative
        ${theme === "dark"
          ? "bg-[#0B141A] text-gray-100"
          : "bg-gray-100 text-gray-900"
        }`}
    >
      {!isMobile && <SideBar />}

      <div className={`flex-1 flex overflow-hidden relative ${isMobile ? "flex-col" : ""}`}>
        <AnimatePresence initial={false}>
          {(!selectedContact || !isMobile) && (
            <motion.div
              key="chatlist"
              initial={{ x: isMobile ? "-100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween" }}
              className={`w-full md:w-2/5 h-full overflow-hidden ${isMobile ? "pb-16" : ""}
                ${theme === "dark" ? "bg-[#111B21]" : "bg-gray-50"}`}
            >
              {children}
            </motion.div>
          )}

          {(selectedContact || !isMobile) && (
            <motion.div
              key="chatWindow"
              initial={{ x: isMobile ? "-100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween" }}
              className={`w-full h-full overflow-hidden
                ${theme === "dark" ? "bg-[#0B141A]" : "bg-white"}`}
            >
              <ChatWindow
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
                isMobile={isMobile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isMobile && <SideBar />}

      {/* THEME DIALOG */}
      {isThemeDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div
            className={`w-full max-w-sm rounded-xl p-6 shadow-2xl
              ${theme === "dark"
                ? "bg-zinc-900 text-gray-100 border border-zinc-800"
                : "bg-gray-50 text-gray-900 border border-gray-200"
              }`}
          >
            <h2 className="text-xl font-semibold mb-5">
              Appearance
            </h2>

            <div className="space-y-3">
              <label
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer
                  ${theme === "light"
                    ? "bg-gray-200"
                    : "hover:bg-zinc-800"
                  }`}
              >
                <span>Light</span>
                <input
                  type="radio"
                  checked={theme === "light"}
                  onChange={() => setTheme("light")}
                  className="accent-indigo-600"
                />
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer
                  ${theme === "dark"
                    ? "bg-zinc-800"
                    : "hover:bg-gray-200"
                  }`}
              >
                <span>Dark</span>
                <input
                  type="radio"
                  checked={theme === "dark"}
                  onChange={() => setTheme("dark")}
                  className="accent-indigo-600"
                />
              </label>
            </div>

            <button
              onClick={toggleThemeDialog}
              className="mt-6 w-full py-2 rounded-lg font-medium
                bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {isStatusPreviewOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          {statusPreviewContent}
        </div>
      )}
    </div>
  )
}

export default Layout
