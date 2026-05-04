import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { setToken, clearToken } from '../api/api'

interface AuthContextType {
  token: string | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('token'))

  const login = useCallback((t: string) => {
    localStorage.setItem('token', t)
    setToken(t)
    setTokenState(t)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    clearToken()
    setTokenState(null)
  }, [])

  // Listen for 401 events dispatched by the API interceptor
  useEffect(() => {
    const handle = () => logout()
    window.addEventListener('auth:logout', handle)
    return () => window.removeEventListener('auth:logout', handle)
  }, [logout])

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
