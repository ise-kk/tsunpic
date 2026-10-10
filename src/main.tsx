import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/zen-kaku-gothic-new/400.css'
import '@fontsource/zen-kaku-gothic-new/700.css'
import './theme/global.css'
import { App } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('root 要素が見つかりません')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
