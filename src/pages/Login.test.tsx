import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { api } from '../api/client'
import type { TokenResponse } from '../api/types'
import { AuthProvider } from '../auth/AuthContext'
import { Login } from './Login'

const TOKEN_RESPONSE: TokenResponse = {
  access_token: 'token-123',
  token_type: 'bearer',
  user: { id: 1, username: 'student', is_admin: false, created_at: '2026-01-01T00:00:00Z' },
}

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('Login', () => {
  it('opens a saved profile with username only', async () => {
    const loginSpy = vi.spyOn(api, 'login').mockResolvedValue(TOKEN_RESPONSE)
    renderLogin()
    await userEvent.type(screen.getByLabelText('Profile name'), 'student')
    await userEvent.click(screen.getByRole('button', { name: 'Open profile' }))
    await waitFor(() => expect(loginSpy).toHaveBeenCalledWith('student'))
  })

  it('shows the error message when login fails', async () => {
    vi.spyOn(api, 'login').mockRejectedValue(new Error('No profile with that name exists.'))
    renderLogin()
    await userEvent.type(screen.getByLabelText('Profile name'), 'nobody')
    await userEvent.click(screen.getByRole('button', { name: 'Open profile' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No profile with that name exists.',
    )
  })
})
