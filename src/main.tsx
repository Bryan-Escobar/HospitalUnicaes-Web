import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { aplicarTema } from './hooks/useTheme'
import { queryClient } from './lib/query-client'

// Aplica el tema guardado antes del primer render para evitar parpadeo
aplicarTema()

//capa inicial de la app
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  </BrowserRouter>
)
