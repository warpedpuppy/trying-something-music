import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, setToken } from '../api/client'
import { findUserById, getOrCreateDefaultUser, getSession, setSession } from '../lib/localDb'
import type { User } from '../api/types'
import { AuthContext } from './authContextValue'

function resolveInitialUser(): User | null {
  const session = getSession()
  if (session) {
    const u = findUserById(session.userId)
    if (u) return { id: u.id, username: u.username, is_admin: u.isAdmin, created_at: u.createdAt }
  }
  // No session — auto-create and login the default "You" user
  const defaultUser = getOrCreateDefaultUser()
  setSession(defaultUser.id)
  return { id: defaultUser.id, username: defaultUser.username, is_admin: false, created_at: defaultUser.createdAt }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(resolveInitialUser)
  const [loading] = useState(false)

  const login = useCallback(async (username: string) => {
    const response = await api.login(username)
    setToken(response.access_token)
    setUser(response.user)
  }, [])

  const register = useCallback(async (username: string) => {
    const response = await api.register(username)
    setToken(response.access_token)
    setUser(response.user)
  }, [])

  // Logout returns to the default "You" user rather than leaving no user at all
  const logout = useCallback(() => {
    const defaultUser = getOrCreateDefaultUser()
    setToken(`local:${defaultUser.id}`)
    setUser({ id: defaultUser.id, username: defaultUser.username, is_admin: false, created_at: defaultUser.createdAt })
  }, [])

  const value = useMemo(() => {
    const localUser = user ? findUserById(user.id) : null
    const isDefaultUser = localUser?.isDefault === true
    return { user, isDefaultUser, loading, login, register, logout }
  }, [user, loading, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
