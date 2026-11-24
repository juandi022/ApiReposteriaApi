import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GestionUsuarios from './paginas/GestionUsuarios'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GestionUsuarios />
  </StrictMode>,
)
