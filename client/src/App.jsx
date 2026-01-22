import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/user-login/Login'
import { ToastContainer } from "react-toastify"

import Home from './components/Home'
import { ProtectedRoute, PublicRoute } from './Protected'
import userStore from './store/userStore'
import { diconnectSocket, initializeSocket } from './services/chat'
import { chatStore } from './store/chatStore'
import Setting from './pages/settingPage/Setting'
import Status from './pages/StatusSection/Status'
import UserDetails from './components/UserDetails'

const App = () => {

  const {user} = userStore()
  const {setCurrentUser , initsocketListeners,cleanup} = chatStore()
  useEffect(()=>{
    if(user?._id){
      const socket = initializeSocket()
      if(socket){
        setCurrentUser(user)
        initsocketListeners()
      }
    }

    return ()=>{
      cleanup()
      diconnectSocket()
    }
  }, [user,setCurrentUser,initsocketListeners,cleanup])
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route element={<PublicRoute/>}>
        <Route path='/user-login' element={<Login />} />
        </Route>
        <Route element={<ProtectedRoute/>}>
        <Route path='/' element={<Home />} />
        <Route path='/setting' element={<Setting />} />
        <Route path='/status' element={<Status />} />
        <Route path='/user-profile' element={<UserDetails />} />
        {/* <Route path='/help' element={<Setting />} /> */}
        </Route>
      </Routes>
    </>

  )
}

export default App
