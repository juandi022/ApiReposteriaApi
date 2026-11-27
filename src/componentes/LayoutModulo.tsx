import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import type { EstadoRuta } from '../tipos'

export default function LayoutModulo() {
  const { logout } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [cerrando, setCerrando] = useState(false)
  const mensaje = (ubicacion.state as EstadoRuta | null)?.mensaje

  const cerrar = async () => {
    setCerrando(true)
    await logout()
    navegar('/login', {
      replace: true,
      state: { mensaje: 'Cerraste sesión correctamente.' },
    })
  }

  return (
    <main className="layout app-layout modulo-layout">
      <div className="barra-superior">
        <Link className="enlace" to="/inicio">← Volver al inicio</Link>
        <button type="button" className="enlace" onClick={cerrar} disabled={cerrando}>
          {cerrando ? 'Cerrando…' : 'Cerrar sesión'}
        </button>
      </div>
      <div className="contenido-modulo">
        {mensaje && <p className="aviso">{mensaje}</p>}
        <Outlet />
      </div>
    </main>
  )
}
