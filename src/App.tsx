import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ToastProvider } from './components/Toast'
import { UpdatePrompt } from './components/UpdatePrompt'
import { HomePage } from './pages/HomePage'
import { LicensesPage, PrivacyPage, TermsPage } from './pages/legal'
import { NewWorkPage } from './pages/NewWorkPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SettingsPage } from './pages/SettingsPage'
import { WorkPage } from './pages/WorkPage'

// GitHub Pages ではサーバー側の振り分けができないため、# 付きのURLで画面を切り替える
export function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/new" element={<NewWorkPage />} />
            <Route path="/work/:id" element={<WorkPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/licenses" element={<LicensesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppShell>
        <UpdatePrompt />
      </ToastProvider>
    </HashRouter>
  )
}
