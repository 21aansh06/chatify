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
    ? `chat-bubble md:max-w-[50%] min-w-[130px] rounded-2xl shadow-sm ${theme === "dark"
      ? "bg-indigo-600 text-white"
      : "bg-indigo-600 text-white"
    }`
    : `chat-bubble md:max-w-[50%] min-w-[130px] rounded-2xl shadow-sm ${theme === "dark"
      ? "bg-zinc-800 text-zinc-100"
      : "bg-white text-zinc-900 border border-zinc-200"
    }`

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

  if (message === 0) return
  return (
    <div className={`chat ${bubbleClass} mb-2`}>
      <div className={`${bubbleContentClass} relative group before:hidden`} ref={messageRef}>
        <div className='flex flex-col gap-1'>
          {message.contentType === "text" && <p className='text-sm leading-relaxed font-medium'> {message.content}</p>}
          {message.contentType === "image" && (
            <div className="space-y-2">
              <img src={message.imageURL} alt="image/video" className='rounded-xl max-w-xs shadow-inner border border-black/5' />
              {message.content && <p className='text-sm font-medium'>{message.content}</p>}
            </div>
          )}
          {message.contentType === "video" && (
            <div className="space-y-2">
              <video src={message.imageURL} alt="image/video" controls className='rounded-xl max-w-xs shadow-inner' />
              {message.content && <p className='text-sm font-medium'>{message.content}</p>}
            </div>
          )}
        </div>

        <div className={`self-end flex items-center justify-end gap-1 text-[10px] font-bold mt-1.5 ${isUserMessage ? "text-indigo-100/70" : "text-zinc-500"}`}>
          <span>{format(new Date(message.createdAt), "HH:mm")}</span>
          {isUserMessage && (
            <div className="flex items-center">
              {message.messageStatus === "send" && <FaCheck size={10} />}
              {message.messageStatus === "delivered" && <FaCheckDouble size={10} />}
              {message.messageStatus === "read" && <FaCheckDouble size={10} className='text-sky-300' />}
            </div>
          )}
        </div>

        {/* Floating Actions */}
        <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20'>
          <button onClick={() => setShowOptions((prev) => !prev)} className={`p-1.5 cursor-pointer rounded-lg transition-colors ${theme === "dark" ? "hover:bg-black/20 text-white/70" : "hover:bg-zinc-100 text-zinc-500"}`}>
            <HiDotsVertical size={16} />
          </button>
        </div>

        <div className={`absolute ${isUserMessage ? "-left-12" : "-right-12"} top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-2`}>
          <button onClick={() => setShowReactions(!showReactions)} className={`p-2.5 rounded-xl shadow-xl border backdrop-blur-md transition-transform active:scale-90 ${theme === "dark" ? "bg-zinc-900/80 border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 text-zinc-500"
            }`}>
            <FaFaceSmile />
          </button>
        </div>

        {/* Reaction Bar */}
        {showReactions && (
          <div
            ref={reactionsMenuRef}
            className={`absolute -top-9 z-50 flex items-center gap-1 px-2 py-1 rounded-full shadow-lg
      ${isUserMessage ? "right-2" : "left-2"}
      ${theme === "dark"
                ? "bg-zinc-900 border border-zinc-700"
                : "bg-white border border-zinc-200"
              }
    `}
          >
            {quickReactions.map((emoji, index) => (
              <button
                key={index}
                className="text-lg hover:scale-125 transition-transform"
                onClick={() => handleReact(emoji)}
              >
                {emoji}
              </button>
            ))}

            <div className={`w-[1px] h-5 mx-1 ${theme === "dark" ? "bg-zinc-700" : "bg-zinc-300"}`} />

            <button
              className={`p-1 rounded-full transition-colors ${theme === "dark"
                  ? "hover:bg-zinc-800 text-zinc-300"
                  : "hover:bg-zinc-100 text-zinc-600"
                }`}
              onClick={() => setShowEmojiPicker(true)}
            >
              <FaPlus className="h-4 w-4" />
            </button>
          </div>
        )}



        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className={`absolute top-full mt-2 z-50
      ${isUserMessage ? "right-0" : "left-0"}
    `}
          >
            <div className="relative">
              <EmojiPicker
                onEmojiClick={(emojiObject) => {
                  handleReact(emojiObject.emoji)
                }}
                theme={theme}
              />
              <button
                className="absolute top-3 right-3 p-1 bg-zinc-800 rounded-full text-white"
                onClick={() => setShowEmojiPicker(false)}
              >
                <RxCross2 size={14} />
              </button>
            </div>
          </div>
        )}


        {/* Displayed Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`absolute -bottom-3 ${isUserMessage ? "right-2" : "left-2"} rounded-full px-2 py-0.5 shadow-md border flex items-center gap-0.5 z-10 ${theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-white border-zinc-200"
            }`}>
            {message.reactions.map((reaction, index) => (
              <span key={index} className='text-xs'>
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Options Dropdown */}
        {showOptions && (
          <div ref={optionRef} className={`absolute top-10 right-0 z-50 w-40 rounded-2xl shadow-2xl border p-1.5 animate-in fade-in slide-in-from-top-2 ${theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
            }`}>
            <button onClick={() => {
              if (message.contentType === "text") {
                navigator.clipboard.writeText(message.content)
              }
              setShowOptions(false)
            }}
              className={`flex items-center w-full cursor-pointer px-3 py-2.5 gap-3 rounded-xl font-bold text-xs transition-colors ${theme === "dark" ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-50 text-zinc-600"
                }`}>
              <FaRegCopy size={14} className="text-indigo-500" />
              <span>Copy Text</span>
            </button>
            {isUserMessage && (
              <button onClick={() => {
                deleteMessage(message?._id)
                setShowOptions(false)
              }}
                className={`flex cursor-pointer items-center w-full px-3 py-2.5 gap-3 rounded-xl font-bold text-xs transition-colors ${theme === "dark" ? "hover:bg-red-500/10 text-red-500" : "hover:bg-red-50 text-red-600"
                  }`}>
                <MdDeleteOutline size={16} />
                <span>Delete Message</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble