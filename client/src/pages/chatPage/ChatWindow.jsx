import React from 'react'
import { useState, useRef } from 'react'
import themeStore from "../../store/themeStore"
import userStore from '../../store/userStore'
import { chatStore } from '../../store/chatStore'
import { useEffect } from 'react'
import { isToday, isYesterday, format } from "date-fns"
import { FaArrowLeft, FaFile, FaImage, FaLock, FaPaperclip, FaPaperPlane, FaVideo } from "react-icons/fa6"
import chatWindow_image from "../../images/chatWindow_image.png"
import { FaEllipsisV, FaSmile, FaTimes } from 'react-icons/fa'
import MessageBubble from './MessageBubble'
import EmojiPicker from 'emoji-picker-react';
import { useLayoutEffect } from 'react'
import { toast } from "react-toastify"

const ChatWindow = ({ selectedContact, setSelectedContact }) => {
  const isValidate = (date) => {
    return date instanceof Date && !isNaN(date)
  }

  const [message, setMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [filePreview, setFilePreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [options, setOptions] = useState(false)
  const typingTimeoutRef = useRef(null)
  const messageEndRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const fileInputRef = useRef(null)
  const chatRef = useRef(null)
  const prevScrollHeightRef = useRef(0)
  const isLoadingOldRef = useRef(false)
  const isAtBottomRef = useRef(true)

  const { theme } = themeStore()
  const { user } = userStore()



  const {
    messages,
    currentConversation,
    loading,
    sendMessage,
    recieveMessage,
    fetchMessages,
    fetchConversations,
    conversations,
    isUserTyping,
    startTyping,
    stopTyping,
    getUserLastSeen,
    isUserOnline,
    deleteMessage,
    addReaction,
    loadingMore,
    hasMore,
    fetchMoreMessages,
    cleanup
  } = chatStore()

  const online = isUserOnline(selectedContact?._id)
  const lastSeen = getUserLastSeen(selectedContact?._id)
  const isTyping = isUserTyping(selectedContact?._id)

  useEffect(() => {
    if (selectedContact?._id && conversations?.length > 0) {
      const conversation = conversations?.find((conv) =>
        conv.participants.some((participant) => participant._id === selectedContact?._id))
      if (conversation?._id) {
        fetchMessages(conversation._id)
      }
    }
  }, [selectedContact, conversations])


  useEffect(() => {
    fetchConversations()
  }, [])

  // const scrollToBottom = () => {
  //   messageEndRef.current?.scrollIntoView({ behavior: "auto" })
  // }
  const handleScroll = () => {
    if (!chatRef.current || !hasMore || loadingMore) return

    if (chatRef.current.scrollTop === 0) {
      isLoadingOldRef.current = true
      fetchMoreMessages()
    }

    const { scrollTop, scrollHeight, clientHeight } = chatRef.current
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)
    isAtBottomRef.current = distanceFromBottom < 50
  }

  useEffect(() => {
    if (loadingMore && chatRef.current) {
      prevScrollHeightRef.current = chatRef.current.scrollHeight
    }
  }, [loadingMore])

  useLayoutEffect(() => {
    if (isLoadingOldRef.current && chatRef.current) {
      const newHeight = chatRef.current.scrollHeight
      chatRef.current.scrollTop =
        newHeight - prevScrollHeightRef.current

      isLoadingOldRef.current = false
    }
  }, [messages])




  useEffect(() => {
    if (!chatRef.current) return
    // Only auto-scroll when user is already near the bottom
    if (!isAtBottomRef.current) return
    messageEndRef.current?.scrollIntoView({ behavior: "auto" })
  }, [messages])



  useEffect(() => {
    if (message && selectedContact) {
      startTyping(selectedContact?._id)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(selectedContact?._id)
      }, 2000)
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [message, selectedContact, startTyping, stopTyping])


  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setShowFileMenu(false)
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file))
      }
    }
  }


  const handleSendMessage = async () => {
    if (!selectedContact) return
    if (!message.trim() && !selectedFile) return

    setFilePreview(null)

    try {
      const formData = new FormData()
      formData.append("senderId", user?._id)
      formData.append("recieverId", selectedContact?._id)

      const status = online ? "delivered" : "send"
      formData.append("messageStatus", status)

      if (message.trim()) {
        formData.append("content", message.trim())
      }

      if (selectedFile) {
        formData.append("media", selectedFile, selectedFile.name)
      }

      await sendMessage(formData)

      setMessage("")
      setSelectedFile(null)
      setFilePreview(null)
      setShowFileMenu(false)

    } catch (error) {
      const status = error?.response?.status
      const backendMsg = error?.response?.data?.message

      if (status === 429) {
        toast.error(backendMsg || "You are sending messages too fast")
      } else {
        toast.error("Failed to send message")
      }
    }
  }


  const renderDateSeparator = (date) => {
    if (!isValidate(date)) {
      return null
    }
    let dateString;
    if (isToday(date)) {
      dateString = "Today"
    } else if (isYesterday(date)) {
      dateString = "Yesterday"
    } else {
      dateString = format(date, "EEE,MMMM d")
    }
    return (
      <div className='flex justify-center my-4'>
        <span className={`px-4 py-2 rounded-full text-sm ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}>
          {dateString}
        </span>
      </div>
    )

  }

const groupedMessages = Array.isArray(messages)
  ? messages.reduce((acc, message) => {
      if (!message.createdAt || !message.conversation) return acc;

      const date = new Date(message.createdAt);
      if (isValidate(date)) {
        const dateString = format(date, "yyyy-MM-dd");
        const convId = message.conversation;

        if (!acc[convId]) {
          acc[convId] = {};
        }
        if (!acc[convId][dateString]) {
          acc[convId][dateString] = [];
        }
        acc[convId][dateString].push(message);
      } else {
        console.error("Invalid date", message);
      }
      return acc;
    }, {})
  : {};

  const handleReaction = (messageId, emoji) => {
    addReaction(messageId, emoji)
  }

  if (!selectedContact) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center'>
        <div className='max-w-md'>
          <img src={chatWindow_image} alt="chat-app" className='w-full h-auto' />
          <h2 className={`text-3xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
            Select a conversation to start chatting
          </h2>
          <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-6`}>
            Choose a contact from the list on the left to begin messaging
          </p>
          <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} text-sm mt-8 flex items-center justify-center gap-2`}>
            <FaLock className='w-4 h-4' />
            Your personal messages are end-to-end encrypted(not now this feature will come soon)
          </p>
        </div>
      </div>
    )
  }
  //   console.log("CHAT STORE RAW:", {
  //   messages,
  //   type: typeof messages,
  //   isArray: Array.isArray(messages),
  // })
  // console.log(messages)



  return (

    <div className='flex-1 h-screen w-full flex flex-col'>
      <div className={`p-4 ${theme === "dark" ? "bg-[#303430] text-white" : "bg-[rgb(239,242,245)] flex items-center"}`}>
        <button className='mr-2 focus:outline-none cursor-pointer' onClick={() => setSelectedContact(null)}>
          <FaArrowLeft className='h-6 w-6' />
        </button>
        <img src={selectedContact?.profilePic} alt={selectedContact?.username} className='w-10 h-10 rounded-full' />
        <div className='ml-3 flex-grow'>
          <h2 className='font-semibold text-start'>
            {selectedContact?.username}
          </h2>
          {isTyping ? (
            <div>Typing...</div>
          ) : (
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              {online ? "Online" : lastSeen ? `Last seen ${format(new Date(lastSeen), "HH:mm")}` : "Offline"}
            </p>
          )}
        </div>

      </div>
      <div ref={chatRef} onScroll={handleScroll} className={`flex-1 p-4 overflow-y-auto ${theme === "dark" ? "bg-[#191a1a]" : "bg-[rgb(241,236,229)]"}`}>
        {Object.entries(groupedMessages[selectedContact?.conversation?._id] || {})
          .map(([date, msgs]) => (
            <React.Fragment key={`${selectedContact?.conversation?._id}-${date}`}>
              {renderDateSeparator(new Date(date))}
              {msgs
                .filter(
                  (msg) => msg.conversation === selectedContact?.conversation?._id
                )
                .map((msg) => (
                  <MessageBubble
                    key={`${msg.conversation}-${msg._id || msg.tempId}`}
                    message={msg}
                    theme={theme}
                    currentUser={user}
                    onReact={handleReaction}
                    deleteMessage={deleteMessage}
                  />
                ))}
            </React.Fragment>
          ))}
        <div ref={messageEndRef} />
      </div>
      {filePreview && (
        <div className='relative p-2'>
          {selectedFile?.type.startsWith("video/") ? (
            <video src={filePreview} controls className='w-80 object-cober rounded shadow-lg mx-auto' />
          ) : (

            <img src={filePreview} alt="" className='w-80 object-cover rounded shadow-lg mx-auto' />
          )}
          <button
            onClick={() => {
              setSelectedFile(null);
              setFilePreview(null)
            }}
            className='absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1'>
            <FaTimes className='h-4 w-4' />
          </button>
        </div>
      )}

      <div className={`p-4 ${theme === "dark" ? "bg-[#303430]" : "bg-white"} flex items-center space-x-2 relative`}>
        <button className='focus:outline-none cursor-pointer' onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          <FaSmile className={`h-6 w-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
        </button>
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className='absolute left-0 bottom-16 z-50'>
            <EmojiPicker
              onEmojiClick={(emojiObject) => {
                setMessage((prev) => prev + emojiObject.emoji)
                setShowEmojiPicker(false)
              }}
              theme={theme} />
          </div>
        )}
        <div className='relative'>
          <button className='focus:outline-none' onClick={() => setShowFileMenu(!showFileMenu)}>
            <FaPaperclip className={`h-6 w-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"} cursor-pointer mt-2`} />
          </button>
          {showFileMenu && (
            <div className={`absolute bottom-full left-0 mb-2 ${theme === "dark" ? "bg-gray-700" : "bg-white"} rounded-lg shadow-lg`}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept='image/*,videos/*' className='hidden' />
              <button onClick={() => fileInputRef.current.click()} className={`flex items-center px-4 py-2 w-full transition-colors ${theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-100"}`}>
                <FaImage className='mr-2' /> Image/Video
              </button>
              <button onClick={() => fileInputRef.current.click()} className={`flex items-center px-4 py-2 w-full transition-colors ${theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-100"}`}>
                <FaFile className='mr-2' /> Documents
              </button>
            </div>
          )}
        </div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSendMessage()
            }
          }}
          placeholder='Type a message...'
          className={`flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 ${theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white text-black border-gray-300"}`} />
        <button onClick={handleSendMessage} className='focus:outline-none cursor-pointer'>
          <FaPaperPlane className='h-6 w-6 text-green-500' />
        </button>
      </div>
    </div>
  )
}

export default ChatWindow
