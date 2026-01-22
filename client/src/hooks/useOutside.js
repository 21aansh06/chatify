import React from 'react'
import { useEffect } from 'react'

const useOutside = (ref,callback) => {
  useEffect(()=>{
    const handleUserClick = (event)=>{
        if(ref.current&& !ref.current.contains(event.target)){
            callback()
        }
        document.addEventListener("mousedown" , handleUserClick)
        return()=>{
            document.removeEventListener("mousedown",handleUserClick)
        }
    }
  } , [ref,callback])
}

export default useOutside
