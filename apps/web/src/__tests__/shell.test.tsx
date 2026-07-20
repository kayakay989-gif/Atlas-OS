import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HomePage from '../../app/page'

describe('HomePage shell', () => {
  it('renders foundation ready message', () => {
    render(<HomePage />)
    expect(screen.getByText(/Engineering foundation ready/i)).toBeInTheDocument()
  })
})
