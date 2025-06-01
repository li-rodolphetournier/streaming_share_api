import './index.css'
// Importer les utilitaires de diagnostic
import './utils/diagnostics'
import './utils/quickTest'

import App from './App.tsx'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
