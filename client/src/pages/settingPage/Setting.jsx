import React, { useState } from 'react'
import themeStore from '../../store/themeStore'
import userStore from '../../store/userStore'
import { logoutUser } from "../../services/user"
import { toast } from 'react-toastify'
import Layout from '../../components/Layout'
import { FaQuestionCircle, FaSearch, FaSignInAlt } from 'react-icons/fa'
import { FaComment, FaMoon, FaSun, FaUser } from 'react-icons/fa6'
import { Link } from 'react-router-dom'

const Setting = () => {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false)
  const { theme } = themeStore()
  const { user, clearUser } = userStore()
  const toggleThemeDialog = () => {
    setIsThemeDialogOpen(!isThemeDialogOpen)
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      clearUser()
      toast.success("Logged out successfully")
    } catch (error) {

    }
  }

  return (
    <Layout isThemeDialogOpen={isThemeDialogOpen} toggleThemeDialog={toggleThemeDialog}>
      <div className={`flex h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}>
        <div className={`w-[400px] border-r ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>
          <div className='p-4'>
            <h1 className='text-xl font-semibold mb-4'>Settings</h1>
            {/* <div className='relative mb-4'>
              <FaSearch className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
              <input type="text" placeholder='search settings' className={`w-full ${theme === "dark" ? "bg-black text-white border-white/40" : "bg-gray-100 text-black"} border pl-10 placeholder-gray-400 rounded p-2`} />
            </div> */}
            <div className={`flex items-center gap-4 p-3 ${theme === "dark" ? "hover:bg-gray-900" : "hover:bg-gray-100"} rounded-lg cursor-pointer mb-4`}>
              <img src={user.profilePic} alt="profile" className='w-14 h-14 rounded-full' />
              <div className=''>
                <h2 className='font-semibold'>{user.username}</h2>
                <p className='text-sm text-gray-400'>{user.about}</p>
              </div>
            </div>
            {/* menu */}
            <div className='h-[calc(100vh-280px)] overflow-y-auto'>
              <div className='space-y-1'>
                {
                  [
                    { icon: FaUser, label: "Account", href: "/user-profile" },
                    { icon: FaComment, label: "Chats", href: "/" },
                    { icon: FaQuestionCircle, label: "Help", href: "/help" },
                  ].map((item) => (
                    <Link to={item.href} key={item.label} className={`w-full flex items-center gap-3 p-2 rounded ${theme === "dark" ? "text-white hover:bg-gray-900" : "text-black hover:bg-gray-100"}`}>
                      <item.icon className='h-5 w-5' />
                      <div className={`border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"} w-full p-4`}>
                        {item.label}
                      </div>
                    </Link>
                  ))
                }
                {/* theme */}
                <button onClick={toggleThemeDialog} className={`w-full flex items-center gap-3 p-2 rounded ${theme === "dark" ? "text-white hover:bg-gray-900" : "text-black hover:bg-gray-100"}`}>
                  {theme === "dark" ? (
                    <FaMoon className='h-5 w-5' />
                  ) : (
                    <FaSun className='h-5 w-5' />
                  )}
                  <div className={`flex flex-col text-start border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"} w-full p-2`}>
                    Theme
                    <span className='ml-auto text-sm text-gray-400'>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </span>
                  </div>
                </button>
              </div>
              <button onClick={handleLogout} className={`w-full flex items-center gap-3 p-2 bottom-0 cursor-pointer rounded text-red-500 ${theme === "dark" ? "border-gray-700 " : "border-gray-200"} mt-10 md:mt-36`}>
                <FaSignInAlt className='h-5 w-5' />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>

  )
}

export default Setting
