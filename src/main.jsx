import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Asegúrate de que #root ocupe toda la pantalla (ya en index.css o inline en index.html)
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div style={{ width: '100%', height: '100%' }}>
      <App />
    </div>
  </StrictMode>,
)
