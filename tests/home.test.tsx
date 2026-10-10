import 'fake-indexeddb/auto'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from '../src/pages/HomePage'

describe('ホーム画面', () => {
  it('作品がないときの案内と、ならべるの入口が表示される', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Tsunpic' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'まだ作品がありません' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ならべる/ })).toHaveAttribute('href', '/new')
    expect(screen.getByText(/外部に送信されることはありません/)).toBeInTheDocument()
  })
})
