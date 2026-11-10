import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('application startup', () => {
  it('renders the application without crashing', () => {
    render(<App />)
    expect(document.body).toBeInTheDocument()
  })
})
