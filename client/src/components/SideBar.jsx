import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import themeStore from '../store/themeStore'
import userStore from '../store/userStore'
import layoutStore from '../store/layoutStore'
import { LuMessageCircleCode } from "react-icons/lu";
import { FaCog, FaUserCircle } from "react-icons/fa";
import { motion } from 'framer-motion'
import { MdRadioButtonChecked } from "react-icons/md";

const SideBar = () => {
    const location = useLocation()
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const { theme, setTheme } = themeStore()
    const { user } = userStore()
    const { activeTab, setActiveTab, selectedContact } = layoutStore()

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    useEffect(() => {
        if (location.pathname === "/") {
            setActiveTab("chats")
        } else if (location.pathname === "status") {
            setActiveTab("status")
        } else if (location.pathname === "/user-profile") {
            setActiveTab("profile")
        } else if (location.pathname === "/setting") {
            setActiveTab("setting")
        }
    }, [location, setActiveTab])

    if (isMobile && selectedContact) {
        return null
    }

    const SidebarContent = (
        <>
            <Link
                to="/"
                className={`${isMobile ? "" : "mb-8"} bg-indigo-600 p-2 rounded-lg shadow-md
                    `}
            >

                <LuMessageCircleCode
                    className={`h-6 w-6 
                         text-white
                        `}
                />
            </Link>


            {!isMobile && <div className='flex-grow' />}

            <Link
                to="/user-profile"
                className={`${isMobile ? "" : "mb-8"} ${activeTab === "profile"
                    ? theme === "dark"
                        ? "bg-zinc-800 p-2 rounded-lg shadow-md"
                        : "bg-indigo-100 p-2 rounded-lg shadow-md"
                    : ""
                    }`}
            >

                {user?.profilePic ? (
                    <img src={user.profilePic} alt="user" className='h-6 w-6 rounded-full object-cover' />
                ) : (
                    <FaUserCircle
                        className={`h-6 w-6 ${activeTab === "profile"
                            ? theme === "dark"
                                ? "text-indigo-400"
                                : "text-indigo-600"
                            : theme === "dark"
                                ? "text-zinc-500"
                                : "text-indigo-500"
                            }`}
                    />
                )}
            </Link>

            <Link
                to="/setting"
                className={`${isMobile ? "" : "mb-8"} ${activeTab === "setting"
                    ? theme === "dark"
                        ? "bg-zinc-800 p-2 rounded-lg shadow-md"
                        : "bg-indigo-100 p-2 rounded-lg shadow-md"
                    : ""
                    }`}
            >

                <FaCog
                    className={`h-6 w-6 ${activeTab === "setting"
                        ? theme === "dark" ? "text-zinc-400"
                            : "text-gray-500"
                        : theme === "dark"
                            ? "text-zinc-400"
                            : "text-gray-500"
                        }`}
                />
            </Link>
        </>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`${isMobile ? "fixed bottom-0 left-0 right-0 h-16" : "w-16 h-screen border-r"}
            ${theme === "dark" ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"}
            bg-opacity-100 flex items-center py-4 shadow-xl
            ${isMobile ? "flex-row justify-around" : "flex-col justify-between"}`}
        >
            {SidebarContent}
        </motion.div>
    )
}

export default SideBar