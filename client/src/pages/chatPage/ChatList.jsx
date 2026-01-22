import React, { useState } from 'react'
import layoutStore from '../../store/layoutStore'
import themeStore from '../../store/themeStore'
import userStore from '../../store/userStore'
import { FaPlus } from 'react-icons/fa6'
import { FaSearch } from 'react-icons/fa'
import { motion } from 'framer-motion'
import FormatTime from '../../utils/FormatTime'

const ChatList = ({ contacts }) => {
  const { setSelectedContact, selectedContact } = layoutStore()
  const { theme, setTheme } = themeStore()
  const { user } = userStore()
  const [search, setSearch] = useState("")

  const filteredContacts = contacts?.filter((contact) =>
  contact?.username?.toLowerCase().includes(search.toLowerCase())
)
// console.log(filteredContacts)
  return (
    <div className={`w-full border-r h-screen ${theme === "dark" ? "bg-[rgb(17,27,33)] border-gray-600" : "bg-white border-gray-200"}`}>
      <div className={`p-4 flex justify-between ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
        <h2 className='text-xl font-semibold'>
          Chats
        </h2>
      </div>
      <div className='p-2'>
        <div className='relative'>
          <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-800"}`} />
          <input type="text" placeholder='Search user' value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-green-500 ${theme === "dark" ? "bg-gray-800 text-white border-gray-700 placeholder-gray-500" : "bg-gray-100 text-black border-gray-200 placeholder-gray-400"}`} />
        </div>
      </div>
      <div className='overflow-y-auto h-[cal(100vh-120px)]'>
        {filteredContacts.map((contact) => (
          <motion.div
            key={contact._id}
            onClick={() => setSelectedContact(contact)}
            className={`p-3 flex items-center cursor-pointer ${theme === "dark" ? selectedContact?._id === contact?._id ? "bg-gray-700" : "hover:bg-gray-800" : selectedContact?._id === contact?._id ? "bg-gray-200" : "hover:bg-gray-100"}`}>
            <img src={contact?.profilePic} alt={contact?.username} className='w-12 h-12 rounded-full' />
            <div className='ml-3 flex-1'>
              <div className='flex justify-between items-baseline'>
                <h2 className={`font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
                  {contact?.username}
                </h2>
                {contact?.conversation && (
                  <span className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                    {FormatTime(contact?.conversation?.lastMessage?.createdAt)}
                  </span>
                )}
              </div>
              <div className='flex justify-between items-baseline'>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"} truncate`}>
                  {contact?.conversation?.lastMessage?.content}
                </p>
                {contact?.conversation && contact?.conversation?.unreadCount > 0 && contact?.conversation?.lastMessage?.reciever === user?._id && (
                  <p className={`text-sm font-semibold w-6 h-6 flex items-center justify-center bg-yellow-500 ${theme === "dark" ? "text-gray-800" : "text-gray-500"} rounded-full`}>
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
