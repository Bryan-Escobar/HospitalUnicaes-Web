import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { aplicarTema } from './hooks/useTheme'

// Aplica el tema guardado antes del primer render para evitar parpadeo
aplicarTema()

//capa inicial de la app
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <StrictMode>
      <App />
    </StrictMode>
  </BrowserRouter>
)
