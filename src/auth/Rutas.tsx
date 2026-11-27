import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './authContext'

function Cargando() {
  return (
    <main className="layout">
      <div className="cargando">Cargando…</div>
    </main>
  )
}

export function RutaPrivada() {
  const { usuario, verificando } = useAuth()
  const ubicacion = useLocation()

  if (verificando) return <Cargando />
  if (!usuario) return <Navigate to="/login" replace state={{ from: ubicacion }} />
  return <Outlet />
}

export function RutaPublica() {
  const { usuario, verificando } = useAuth()
  const ubicacion = useLocation()
  const estado = ubicacion.state as { from?: { pathname?: string } } | null

  if (verificando) return <Cargando />
  if (usuario) return <Navigate to={estado?.from?.pathname || '/inicio'} replace />
  return <Outlet />
}
