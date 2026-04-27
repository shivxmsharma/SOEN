import React, { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'

const UserAuth = ({ children }) => {

    const { user, loading } = useContext(UserContext)
    const Navigate = useNavigate()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                Navigate('/login')
            }
        }
    }, [loading, user])

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