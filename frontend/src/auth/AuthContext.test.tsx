import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'

// Each test gets a clean localStorage so users don't bleed between cases.
beforeEach(() => localStorage.clear())

describe('AuthContext — auto "You" user', () => {
  it('auto-logs in as "You" when no session exists', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.user).not.toBeNull()
    expect(result.current.user?.username).toBe('You')
  })

  it('isDefaultUser is true for the auto-created "You" profile', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.isDefaultUser).toBe(true)
  })

  it('isDefaultUser is false after creating a named profile', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await act(async () => { await result.current.register('Alice') })
    expect(result.current.user?.username).toBe('Alice')
    expect(result.current.isDefaultUser).toBe(false)
  })

  it('logout returns to "You" rather than leaving user null', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await act(async () => { await result.current.register('Bob') })
    expect(result.current.user?.username).toBe('Bob')
    act(() => { result.current.logout() })
    expect(result.current.user?.username).toBe('You')
    expect(result.current.isDefaultUser).toBe(true)
  })

  it('login switches to an existing named profile', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    // Create a named profile, then log out back to "You", then log back in
    await act(async () => { await result.current.register('Carol') })
    act(() => { result.current.logout() })
    expect(result.current.isDefaultUser).toBe(true)
    await act(async () => { await result.current.login('Carol') })
    expect(result.current.user?.username).toBe('Carol')
    expect(result.current.isDefaultUser).toBe(false)
  })
})
