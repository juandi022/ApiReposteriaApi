import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext.js'
import Encabezado from '../componentes/Encabezado.jsx'

const GRUPOS_MODULOS = [
  {
    nombre: 'Abastecimiento',
    enlaces: [
      { to: '/modulos/compras', etiqueta: 'Compras', descripcion: 'Facturas, productos y confirmación.' },
    ],
  },
  {
    nombre: 'Red de suministro',
    enlaces: [
      { to: '/modulos/proveedores', etiqueta: 'Proveedores', descripcion: 'Contactos y datos de abastecimiento.' },
    ],
  },
  {
    nombre: 'Administración',
    enlaces: [
      { to: '/usuarios', etiqueta: 'Gestión de usuarios', descripcion: 'Cuentas, roles y estados de acceso.' },
    ],
  },
]

export default function Inicio() {
  const { usuario, logout } = useAuth()
  const navegar = useNavigate()
  const [cerrando, setCerrando] = useState(false)

  const cerrar = async () => {
    setCerrando(true)
    await logout()
    navegar('/login', {
      replace: true,
      state: { mensaje: 'Cerraste sesión correctamente.' },
    })
  }

  return (
    <main className="layout app-layout">
      <section className="tarjeta ancha panel-principal">
        <Encabezado titulo="¡Bienvenido!" subtitulo="Tu sesión está activa" />
        <div className="perfil">
          <div><span>Usuario</span><strong>{usuario?.username}</strong></div>
          <div><span>Correo</span><strong>{usuario?.useremail}</strong></div>
          <div><span>Tipo</span><strong>{usuario?.usertipo || 'PLB'}</strong></div>
        </div>
        <nav className="modulos" aria-label="Módulos de la repostería">
          {GRUPOS_MODULOS.map((grupo) => (
            <div className="grupo-modulos" key={grupo.nombre}>
              <h2>{grupo.nombre}</h2>
              <div className="modulos-grid">
                {grupo.enlaces.map((enlace) => (
                  <Link className="modulo-boton" to={enlace.to} key={enlace.to}>
                    <strong>{enlace.etiqueta}</strong>
                    <span>{enlace.descripcion}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <button className="boton primario" onClick={cerrar} disabled={cerrando}>
          {cerrando ? 'Cerrando…' : 'Cerrar sesión'}
        </button>
      </section>
    </main>
  )
}
