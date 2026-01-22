import React from 'react'
import { useRef } from 'react'
import { useState } from 'react'
import { FaCheck, FaCheckDouble, FaFaceSmile, FaPlus, FaRegCopy } from "react-icons/fa6"
import { format } from "date-fns"
import { HiDotsVertical } from "react-icons/hi"
import useOutside from '../../hooks/useOutside'
import EmojiPicker from 'emoji-picker-react'
import { RxCross2 } from "react-icons/rx"
import { MdDeleteOutline } from "react-icons/md"

const MessageBubble = ({ message, currentUser, onReact, deleteMessage, theme }) => {

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const messageRef = useRef(null)
  const reactionsMenuRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const optionRef = useRef(null)
  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const isUserMessage = message.sender._id === currentUser?._id
  const bubbleClass = isUserMessage ? "chat-end" : "chat-start"

  const bubbleContentClass = isUserMessage
    ? `chat-bubble md:max-w-[50%] min-w-[130px] ${theme === "dark" ? "bg-[#144d38] text-white" : "bg-[#d9fdd3] text-black"}`
    : `chat-bubble md:max-w-[50%] min-w-[130px] ${theme === "dark" ? "bg-[#144d38] text-white" : "bg-white text-black"}`

  const handleReact = (emoji) => {
    onReact(message._id, emoji)
    setShowEmojiPicker(false)
    setShowReactions(false)
  }
  useOutside(emojiPickerRef, () => {
    if (showEmojiPicker) setShowEmojiPicker(false)
  })
  useOutside(reactionsMenuRef, () => {
    if (showEmojiPicker) setShowReactions(false)
  })
  useOutside(optionRef, () => {
    if (showEmojiPicker) setShowOptions(false)
  })
  // console.log(message)
  if (message === 0) return
  return (
    <div className={`chat ${bubbleClass}`}>
      <div className={`${bubbleContentClass} relative group`} ref={messageRef}>
        <div className='flex justify-center gap-2'>
          {message.contentType === "text" && <p className='mr-2'> {message.content}</p>}
          {message.contentType === "image" && (
            <div>
              <img src={message.imageURL} alt="image/video" className='rounded-lg max-w-xs' />
              <p className='mt-1'>{message.content}</p>
            </div>
          )}
          {message.contentType === "video" && (
            <div>
              <video src={message.imageURL} alt="image/video" controls className='rounded-lg max-w-xs' />
              <p className='mt-1'>{message.content}</p>
            </div>
          )}
        </div>
        <div className='self-end flex items-center justify-end gap-1 text-xs opacity-60 mt-2 ml-2'>
          <span>{format(new Date(message.createdAt), "HH:mm")}</span>
          {isUserMessage && (
            <>
              {message.messageStatus === "send" && <FaCheck size={12} />}
              {message.messageStatus === "delivered" && <FaCheckDouble size={12} />}
              {message.messageStatus === "read" && <FaCheckDouble size={12} className='text-blue-500' />}
            </>
          )}
        </div>
        <div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20'>
          <button onClick={() => setShowOptions((prev) => !prev)} className={`p-1 rounded-full cursor-pointer ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
            <HiDotsVertical size={18} />
          </button>
        </div>
        <div className={`absolute ${isUserMessage ? "-left-10" : "-right-10"} top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2`}>
          <button onClick={() => setShowReactions(!showReactions)} className={`p-2 rounded-full ${theme === "dark" ? "bg-[3202c33]/80" : "bg-white hover:bg-gray-100"} shadow-lg`}>
            <FaFaceSmile className={`${theme === "dark" ? "ext-gray-300" : "text-gray-600"}`} />
          </button>
        </div>
        {showReactions && (
          <div ref={reactionsMenuRef} className={`absolute -top-8 ${isUserMessage ? "left-0" : "left-36"} transform -translate-x-1/2 flex items-center hover:bg-[#202c33]/90 rounded-full px-2 gap-1 shadow-lg z-50`}>
            {quickReactions.map((emoji, index) => (
              <button key={index}
                onClick={() => handleReact(emoji)}>
                {emoji}
              </button>
            ))}
            <div className='w-[1px] h-5 bg-gray-600 mx-1' />
            <button className='hover:bg-[#ffffff11a] rounded-full p-1' onClick={() => setShowEmojiPicker(true)}>
              <FaPlus className='h-4 w-4 text-gray-300' />
            </button>
          </div>
        )}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className='absolute left-0 mb-6 z-50'>
            <div>

              <EmojiPicker
                onEmojiClick={(emojiObject) => {
                  handleReact(emojiObject.emoji)
                }}
                theme={theme} />
              <button className='absolute top-2 right-2 text-gray-500 hover:text-gray-700' onClick={() => setShowEmojiPicker(false)}>
                <RxCross2 />
              </button>
            </div>
          </div>
        )}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`absolute -bottom-5 ${isUserMessage ? "right-2" : "left-2"} ${theme === "dark" ? "bg-[#2a3942]" : "bg-gray-200"} rounded-full px-2 shadow-md`}>
            {message.reactions.map((reaction, index) => (
              <span key={index} className='mr-1'>
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}

        {showOptions && (
          <div ref={optionRef} className={`absolute top-8 right-1 z-50 w-36 rounded-xl shadow-lg py-2 text-sm ${theme === "dark" ? "bg-[#1d1f1f] text-white" : "bg-gray-100 text-black"}`}>
            <button onClick={() => {
              if (message.contentType === "text") {
                navigator.clipboard.writeText(message.content)
              }
              setShowOptions(false)
            }}
              className='flex items-center w-full px-4 py-2 gap-3 rounded-lg'>
              <FaRegCopy size={14} />
              <span>Copy</span>
            </button>
            {isUserMessage && (
              <button onClick={() => {
                deleteMessage(message?._id)
                setShowOptions(false)
              }}
                className='flex items-center w-full px-4 py-2 gap-3 rounded-lg text-red-600'>
                <MdDeleteOutline size={18} className='text-red-600' />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
