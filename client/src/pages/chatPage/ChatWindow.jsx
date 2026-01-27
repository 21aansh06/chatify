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
      dateString = format(date, "EEE, MMMM d")
    }
    return (
      <div className='flex justify-center my-6'>
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
          theme === "dark" 
          ? "bg-zinc-800/50 text-zinc-400 border-zinc-700" 
          : "bg-white text-zinc-500 border-zinc-200"
        }`}>
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
      <div className={`flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center transition-colors ${theme === "dark" ? "bg-zinc-950" : "bg-zinc-50"}`}>
        <div className='max-w-md p-8'>
          <img src={chatWindow_image} alt="chat-app" className='w-64 h-auto mx-auto mb-8 opacity-80' />
          <h2 className={`text-3xl font-black tracking-tight mb-4 ${theme === "dark" ? "text-white" : "text-zinc-900"}`}>
            Pick up where you left off
          </h2>
          <p className={`text-sm font-medium leading-relaxed ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"} mb-8`}>
            Select a contact to view your message history and start a new conversation.
          </p>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold uppercase tracking-wider ${
            theme === "dark" ? "bg-zinc-900/50 border-zinc-800 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400"
          }`}>
            <FaLock className='w-3 h-3' />
            End-to-End Encrypted(this will come soon.)
          </div>
        </div>
      </div>
    )
  }
  return (

    <div className={`flex-1 h-screen w-full flex flex-col transition-colors ${theme === "dark" ? "bg-zinc-950" : "bg-zinc-100"}`}>
      {/* Header */}
      <div className={`p-4 flex items-center border-b transition-all ${
        theme === "dark" 
        ? "bg-zinc-900/90 border-zinc-800 backdrop-blur-md text-white" 
        : "bg-white/90 border-zinc-200 backdrop-blur-md text-zinc-900"
      }`}>
        <button className={`mr-4 p-2 rounded-xl cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`} onClick={() => setSelectedContact(null)}>
          <FaArrowLeft className='h-5 w-5' />
        </button>
        <div className="relative">
          <img src={selectedContact?.profilePic} alt={selectedContact?.username} className='w-11 h-11 rounded-2xl object-cover shadow-sm' />
          {online && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>}
        </div>
        <div className='ml-4 flex-grow'>
          <h2 className='font-bold text-lg tracking-tight'>
            {selectedContact?.username}
          </h2>
          {isTyping ? (
            <div className="text-xs font-black text-indigo-500 animate-pulse uppercase tracking-widest">Typing...</div>
          ) : (
            <p className={`text-xs font-bold ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
              {online ? "ACTIVE NOW" : lastSeen ? `LAST SEEN ${format(new Date(lastSeen), "HH:mm")}` : "OFFLINE"}
            </p>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div ref={chatRef} onScroll={handleScroll} className={`flex-1 p-6 overflow-y-auto space-y-2 custom-scrollbar ${
        theme === "dark" 
        ? "bg-zinc-950 bg-[radial-gradient(#1e1e24_1px,transparent_1px)] [background-size:20px_20px]" 
        : "bg-zinc-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"
      }`}>
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
                   key={msg._id ?? msg.tempId}
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

      {/* Preview Section */}
      {filePreview && (
        <div className={`p-4 border-t ${theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}`}>
          <div className='relative inline-block'>
            {selectedFile?.type.startsWith("video/") ? (
              <video src={filePreview} className='w-48 h-48 object-cover rounded-2xl shadow-2xl border-4 border-indigo-500/20' />
            ) : (
              <img src={filePreview} alt="" className='w-48 h-48 object-cover rounded-2xl shadow-2xl border-4 border-indigo-500/20' />
            )}
            <button
              onClick={() => {
                setSelectedFile(null);
                setFilePreview(null)
              }}
              className='absolute -top-3 -right-3 bg-red-500 cursor-pointer hover:bg-red-600 text-white rounded-xl p-2 shadow-lg transition-transform active:scale-90'>
              <FaTimes className='h-4 w-4' />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={`p-4 border-t transition-all relative ${
        theme === "dark" ? "bg-zinc-900/90 border-zinc-800" : "bg-white border-zinc-200"
      }`}>
        <div className="max-w-6xl mx-auto flex items-end gap-3">
            <div className={`flex items-center gap-1 p-1.5 rounded-[2rem] flex-grow border transition-all ${
                theme === "dark" ? "bg-zinc-950 border-zinc-800 focus-within:border-indigo-500" : "bg-zinc-50 border-zinc-200 focus-within:border-indigo-600"
            }`}>
                <button className={`p-2.5 cursor-pointer rounded-full transition-colors ${theme === "dark" ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-500 hover:bg-zinc-200"}`} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <FaSmile className="h-6 w-6" />
                </button>
                
                {showEmojiPicker && (
                    <div ref={emojiPickerRef} className='absolute left-0 bottom-24 z-50 shadow-2xl scale-95 origin-bottom-left transition-all'>
                        <EmojiPicker
                            onEmojiClick={(emojiObject) => {
                                setMessage((prev) => prev + emojiObject.emoji)
                                setShowEmojiPicker(false)
                            }}
                            theme={theme} 
                        />
                    </div>
                )}

                <div className='relative'>
                    <button className={`p-2.5 cursor-pointer rounded-full transition-colors ${theme === "dark" ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-500 hover:bg-zinc-200"}`} onClick={() => setShowFileMenu(!showFileMenu)}>
                        <FaPaperclip className="h-5 w-5" />
                    </button>
                    {showFileMenu && (
                        <div className={`absolute bottom-full left-0 mb-4 w-48 overflow-hidden rounded-2xl shadow-2xl border animate-in fade-in slide-in-from-bottom-2 ${
                            theme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700"
                        }`}>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept='image/*,videos/*' className='hidden' />
                            <button onClick={() => fileInputRef.current.click()} className={`flex cursor-pointer items-center px-4 py-3 w-full text-sm font-bold transition-colors ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-50"}`}>
                                <FaImage className='mr-3 text-indigo-500' /> Photos/Videos
                            </button>
                            <button onClick={() => fileInputRef.current.click()} className={`flex cursor-pointer items-center px-4 py-3 w-full text-sm font-bold transition-colors ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-50"}`}>
                                <FaFile className='mr-3 text-indigo-500' /> Documents
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
                    placeholder='Message...'
                    className="flex-grow bg-transparent px-2 py-3 outline-none font-medium text-sm" 
                />
            </div>

            <button 
                onClick={handleSendMessage} 
                disabled={!message.trim() && !selectedFile}
                className={`p-4 rounded-full transition-all active:scale-90 shadow-lg cursor-pointer ${
                    !message.trim() && !selectedFile 
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" 
                    : theme === "dark" ? "bg-indigo-500 text-white shadow-indigo-500/20" : "bg-indigo-600 text-white shadow-indigo-600/20"
                }`}
            >
                <FaPaperPlane className='h-5 w-5' />
            </button>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow