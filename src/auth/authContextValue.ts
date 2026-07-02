import { createContext } from 'react'
import type { User } from '../api/types'

export interface AuthState {
  user: User | null
  isDefaultUser: boolean
  loading: boolean
  login: (username: string) => Promise<void>
  register: (username: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)
