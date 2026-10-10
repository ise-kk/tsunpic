import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { UpdatePrompt } from './components/UpdatePrompt'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

// GitHub Pages ではサーバー側の振り分けができないため、# 付きのURLで画面を切り替える
export function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
      <UpdatePrompt />
    </HashRouter>
  )
}
