import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from '../src/pages/HomePage'

describe('ホーム画面', () => {
  it('作品がないときの案内と、2つのモードが表示される', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Tsunpic' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'まだ作品がありません' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ならべる/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /つくる/ })).toBeDisabled()
    expect(screen.getByText(/外部に送信されることはありません/)).toBeInTheDocument()
  })
})
