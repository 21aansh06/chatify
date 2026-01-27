import React, { useEffect, useState } from 'react'
import userStore from '../store/userStore'
import themeStore from '../store/themeStore'
import { updateUserProfile } from "../services/user"
import { toast } from 'react-toastify'
import Layout from './Layout'
import { motion } from 'framer-motion'
import { FaCamera, FaCheck, FaPencil } from 'react-icons/fa6'
import { FaSmile } from 'react-icons/fa'
import { MdCancel } from 'react-icons/md'
import EmojiPicker from 'emoji-picker-react'

const UserDetails = () => {
    const [name, setName] = useState("")
    const [about, setAbout] = useState("")
    const [profilePic, setProfilePic] = useState(null)
    const [profilePicPreview, setProfilePicPreview] = useState(null)
    const [isEditingName, setIsEditingName] = useState(false)
    const [isEditingAbout, setIsEditingAbout] = useState(false)
    const [showNameEmoji, setShowNameEmoji] = useState(false)
    const [showAboutEmoji, setShowAboutEmoji] = useState(false)

    const { user, setUser } = userStore()
    const { theme } = themeStore()

    useEffect(() => {
        if (user) {
            setName(user.username || "")
            setAbout(user.about || "")
        }
    }, [user])

    const handleFile = (e) => {
        const file = e.target.files[0]
        if (file) {
            setProfilePic(file)
            setProfilePicPreview(URL.createObjectURL(file))
        }
    }

    const handleSave = async (field) => {
        try {
            const formData = new FormData()

            if (field === "name") {
                formData.append("username", name)
                setIsEditingName(false)
                setShowNameEmoji(false)
            } else if (field === "about") {
                formData.append("about", about)
                setIsEditingAbout(false)
                setShowAboutEmoji(false)
            }

            if (profilePic && field === "profile") {
                formData.append("media", profilePic)
            }

            const updated = await updateUserProfile(formData)
            setUser(updated?.user)
            setProfilePic(null)
            setProfilePicPreview(null)
            toast.success(updated?.message)
        } catch (error) {
            toast.error(error.message || "Failed to update profile")
        }
    }

    const handleEmojiSelect = (emoji, field) => {
        if (field === "name") {
            setName(prev => prev + emoji.emoji)
            setShowNameEmoji(false)
        } else {
            setAbout(prev => prev + emoji.emoji)
            setShowAboutEmoji(false)
        }
    }

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`w-full min-h-screen flex border-r
                ${theme === "dark"
                        ? "bg-black border-zinc-800 text-white"
                        : "bg-white border-gray-200 text-black"
                    }`}
            >
                <div className="w-full rounded-lg p-6">
                    <h1 className="text-2xl font-bold mb-6">Profile</h1>

                    <div className="space-y-6">
                        {/* PROFILE IMAGE */}
                        <div className="flex flex-col items-center">
                            <div className="relative group">
                                <img
                                    src={profilePicPreview || user?.profilePic}
                                    alt="profile"
                                    className="w-52 h-52 rounded-full object-cover"
                                />

                                <label
                                    htmlFor="profileupload"
                                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                >
                                    <FaCamera className="h-8 w-8 text-white" />
                                    <input
                                        type="file"
                                        id="profileupload"
                                        accept="image/*"
                                        onChange={handleFile}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        {profilePicPreview && (
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => handleSave("profile")}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                                >
                                    Change
                                </button>
                                <button
                                    onClick={() => {
                                        setProfilePic(null)
                                        setProfilePicPreview(null)
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                >
                                    Discard
                                </button>
                            </div>
                        )}

                        {/* NAME */}
                        <div className={`relative p-4 rounded-lg shadow-sm
                            ${theme === "dark" ? "bg-zinc-900" : "bg-white"}`}>
                            <label className="block text-sm mb-1 text-gray-500">
                                Your Name
                            </label>

                            <div className="flex items-center">
                                {isEditingName ? (
                                    <input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-md outline-none
                                        ${theme === "dark"
                                                ? "bg-zinc-800 border border-zinc-700 text-white focus:ring-1 focus:ring-green-500"
                                                : "bg-white border text-black"
                                            }`}
                                    />
                                ) : (
                                    <span className="w-full px-3 py-2">{user?.username}</span>
                                )}

                                {isEditingName ? (
                                    <>
                                        <FaCheck onClick={() => handleSave("name")} className="ml-2 text-green-500 cursor-pointer" />
                                        <FaSmile onClick={() => setShowNameEmoji(!showNameEmoji)} className="ml-2 text-yellow-400 cursor-pointer" />
                                        <MdCancel onClick={() => { setIsEditingName(false); setShowNameEmoji(false) }} className="ml-2 text-gray-400 cursor-pointer" />
                                    </>
                                ) : (
                                    <FaPencil onClick={() => setIsEditingName(true)} className="ml-2 text-gray-400 cursor-pointer" />
                                )}
                            </div>

                            {showNameEmoji && (
                                <div className="absolute z-20 -top-80">
                                    <EmojiPicker onEmojiClick={(e) => handleEmojiSelect(e, "name")} />
                                </div>
                            )}
                        </div>

                        {/* ABOUT */}
                        <div className={`relative p-4 rounded-lg shadow-sm
                            ${theme === "dark" ? "bg-zinc-900" : "bg-white"}`}>
                            <label className="block text-sm mb-1 text-gray-500">
                                Your About
                            </label>

                            <div className="flex items-center">
                                {isEditingAbout ? (
                                    <input
                                        value={about}
                                        onChange={e => setAbout(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-md outline-none
                                        ${theme === "dark"
                                                ? "bg-zinc-800 border border-zinc-700 text-white focus:ring-1 focus:ring-green-500"
                                                : "bg-white border text-black"
                                            }`}
                                    />
                                ) : (
                                    <span className="w-full px-3 py-2">{user?.about}</span>
                                )}

                                {isEditingAbout ? (
                                    <>
                                        <FaCheck onClick={() => handleSave("about")} className="ml-2 text-green-500 cursor-pointer" />
                                        <FaSmile onClick={() => setShowAboutEmoji(!showAboutEmoji)} className="ml-2 text-yellow-400 cursor-pointer" />
                                        <MdCancel onClick={() => { setIsEditingAbout(false); setShowAboutEmoji(false) }} className="ml-2 text-gray-400 cursor-pointer" />
                                    </>
                                ) : (
                                    <FaPencil onClick={() => setIsEditingAbout(true)} className="ml-2 text-gray-400 cursor-pointer" />
                                )}
                            </div>

                            {showAboutEmoji && (
                                <div className="absolute z-20 -top-80">
                                    <EmojiPicker onEmojiClick={(e) => handleEmojiSelect(e, "about")} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </Layout>
    )
}

export default UserDetails
