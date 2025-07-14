import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'

const UserAuth = ({ children }) => {

    const { user } = useContext(UserContext)
    const [loading, setloading] = useState(true)
    const token = localStorage.getItem('token')
    const Navigate = useNavigate()

    
    
    
    useEffect(() => {
        
        if(user) {
            setloading(false)
        }

        if (!token) {
            Navigate('/login')
        }

        if(!user) {
            Navigate('/login')
        }

    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="text-white">Loading...</div>
            </div>
        )
    }

  return (
      <>
        {children}
      </>
  )
}

export default UserAuth