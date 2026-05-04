import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  // React Router v6 uses flushSync internally for navigation, which can render this component
  // before the AuthContext state update from login() is committed. Checking localStorage
  // directly guarantees correctness — login() sets it synchronously before calling navigate().
  const isAuth = isAuthenticated || !!localStorage.getItem('token')

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
