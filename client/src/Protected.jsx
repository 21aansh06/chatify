import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import userStore from './store/userStore'
import { checkUserAuth } from './services/user'
import Loader from './utils/Loader'

export const ProtectedRoute = () => {
    const location = useLocation()
    const [isChecking, setIsChecking] = useState(true)
    const { isAuthenticated, setUser, clearUser } = userStore()

    useEffect(() => {

        const verifyAuth = async () => {
            try {
                const result = await checkUserAuth()
                if (result?.isAuthenticated) {
                    setUser(result.user)
                } else {
                    clearUser()
                }
            } catch (error) {
                clearUser()
            } finally {
                setIsChecking(false)
            }
        }
        verifyAuth()
    },[setUser , clearUser])
    
    if(isChecking){
        return <Loader/>
    } 
    if(!isAuthenticated){
        return <Navigate to="/user-login" state={{from:location}} replace/>
    }
    return <Outlet/>
}

export const PublicRoute = ()=>{
    const isAuthenticated = userStore(state => state.isAuthenticated)
    if(isAuthenticated){
        return <Navigate to="/" replace/>
    }
    return <Outlet/>
}

