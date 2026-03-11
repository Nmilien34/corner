import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { applyTheme, subscribeToSystemTheme } from './lib/theme.ts'
import { applyChatFont } from './lib/chatFont.ts'

applyTheme()
applyChatFont()
subscribeToSystemTheme(() => applyTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
