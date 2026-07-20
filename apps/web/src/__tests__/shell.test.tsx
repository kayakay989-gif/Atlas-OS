import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HomePage from '../../app/page'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      },
    }),
  ),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

describe('HomePage shell', () => {
  it('renders get started actions for signed-out users', async () => {
    const ui = await HomePage()
    render(ui)
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })
})
