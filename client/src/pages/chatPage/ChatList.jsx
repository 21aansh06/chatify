import React, { useState } from 'react'
import layoutStore from '../../store/layoutStore'
import themeStore from '../../store/themeStore'
import userStore from '../../store/userStore'
import { FaSearch } from 'react-icons/fa'
import { motion } from 'framer-motion'
import FormatTime from '../../utils/FormatTime'

const ChatList = ({ contacts }) => {
  const { setSelectedContact, selectedContact } = layoutStore()
  const { theme } = themeStore()
  const { user } = userStore()
  const [search, setSearch] = useState("")

  const filteredContacts = contacts?.filter((contact) =>
    contact?.username?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={`w-full border-r h-screen ${
      theme === "dark"
        ? "bg-zinc-950 border-zinc-800"
        : "bg-white border-zinc-200"
    }`}>

      {/* Header */}
      <div className={`p-4 flex justify-between items-center ${
        theme === "dark" ? "text-white" : "text-zinc-900"
      }`}>
        <h2 className="text-xl font-semibold tracking-tight">
          Chats
        </h2>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${
              theme === "dark" ? "text-zinc-400" : "text-zinc-500"
            }`}
          />
          <input
            type="text"
            placeholder="Search user"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none transition ${
              theme === "dark"
                ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-indigo-500"
                : "bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-indigo-500"
            }`}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="overflow-y-auto h-[calc(100vh-120px)]">
        {filteredContacts.map((contact) => (
          <motion.div
            key={contact._id}
            onClick={() => setSelectedContact(contact)}
            className={`p-3 mx-2 my-1 rounded-xl flex items-center cursor-pointer transition ${
              theme === "dark"
                ? selectedContact?._id === contact?._id
                  ? "bg-indigo-600/20"
                  : "hover:bg-zinc-900"
                : selectedContact?._id === contact?._id
                  ? "bg-indigo-50"
                  : "hover:bg-zinc-100"
            }`}
          >
            <img
              src={contact?.profilePic}
              alt={contact?.username}
              className="w-12 h-12 rounded-full object-cover"
            />

            <div className="ml-3 flex-1 overflow-hidden">
              <div className="flex justify-between items-center">
                <h2 className={`font-semibold truncate ${
                  theme === "dark" ? "text-white" : "text-zinc-900"
                }`}>
                  {contact?.username}
                </h2>

                {contact?.conversation && (
                  <span className={`text-xs ${
                    theme === "dark" ? "text-zinc-500" : "text-zinc-400"
                  }`}>
                    {FormatTime(contact?.conversation?.lastMessage?.createdAt)}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center mt-0.5">
                <p className={`text-sm truncate ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                }`}>
                  {contact?.conversation?.lastMessage?.content}
                </p>

                {contact?.conversation &&
                  contact?.conversation?.unreadCount > 0 &&
                  contact?.conversation?.lastMessage?.reciever === user?._id && (
                    <p className="ml-2 text-xs font-semibold min-w-[22px] h-[22px] flex items-center justify-center rounded-full bg-indigo-600 text-white">
                      {contact?.conversation?.unreadCount}
                    </p>
                  )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ChatList
