import { useContext } from 'react'
import { AuthContext } from './authContextValue'
import type { AuthState } from './authContextValue'

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
