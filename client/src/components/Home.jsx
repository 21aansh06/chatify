import React, { useEffect, useState } from 'react'
import Layout from './Layout'
import { motion } from 'framer-motion'
import ChatList from '../pages/chatPage/ChatList'
import layoutStore from '../store/layoutStore'
import { getAllUsers } from '../services/user'
import { toast } from 'react-toastify'

const Home = () => {
  const {setSelectedContact} = layoutStore()
  const [allUsers,setAllUSers] = useState([])
  const getUsers = async (params) => {
    try {
      const result = await getAllUsers()
      if(result.success){
        setAllUSers(result.usersWithConversation)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }
  useEffect(()=>{
    getUsers()
  },[])
  // console.log(allUsers);
  
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className='h-full'
      >
        <ChatList contacts={allUsers} />
      </motion.div>
    </Layout>
  )
}

export default Home
