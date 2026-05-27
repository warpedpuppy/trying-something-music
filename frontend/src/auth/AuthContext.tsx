import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, setToken } from '../api/client'
import { findUserById, getSession } from '../lib/localDb'
import type { User } from '../api/types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

function resolveInitialUser(): User | null {
  const session = getSession()
  if (!session) return null
  const u = findUserById(session.userId)
  if (!u) return null
  return { id: u.id, username: u.username, is_admin: u.isAdmin, created_at: u.createdAt }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(resolveInitialUser)
  const [loading] = useState(false)

  const login = useCallback(async (username: string, password: string) => {
    const response = await api.login(username, password)
    setToken(response.access_token)
    setUser(response.user)
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    const response = await api.register(username, password)
    setToken(response.access_token)
    setUser(response.user)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
