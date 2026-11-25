import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { actualizarContrasena } from '../api.js'
import { useEnvio } from '../auth/useEnvio.js'
import { contrasenaValida } from '../auth/validaciones.js'
import CampoPassword from '../componentes/CampoPassword.jsx'
import Encabezado from '../componentes/Encabezado.jsx'

const inicial = { pin: '', userpswdNueva: '', confirmar: '' }

export default function NuevaContrasena() {
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const { username, useremail, mensaje } = ubicacion.state || {}
  const [formulario, setFormulario] = useState(inicial)
  const { error, cargando, enviar, setError } = useEnvio()

  const cambiar = (campo) => (evento) => {
    setError('')
    const valor = campo === 'pin' ? evento.target.value.replace(/\D/g, '').slice(0, 4) : evento.target.value
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  const hacerCambio = (evento) =>
    enviar(evento, async () => {
      const { pin, userpswdNueva, confirmar } = formulario
      if (!/^\d{4}$/.test(pin)) throw new Error('El PIN debe tener 4 dígitos.')
      if (!contrasenaValida(userpswdNueva)) {
        throw new Error('La contraseña necesita 8 caracteres, una mayúscula, un número y un símbolo.')
      }
      if (userpswdNueva !== confirmar) throw new Error('Las contraseñas no coinciden.')
      await actualizarContrasena(username, useremail, pin, userpswdNueva)
      navegar('/login', {
        replace: true,
        state: { mensaje: 'Contraseña actualizada. Ingresa con tu nueva contraseña.' },
      })
    })

  if (!username || !useremail) return <Navigate to="/recuperacion" replace />

  return (
    <main className="layout">
      <section className="tarjeta">
        <Encabezado
          titulo="Verifica tu identidad"
          subtitulo="Ingresa el PIN enviado a tu correo y tu nueva contraseña"
        />
        {mensaje && <p className="aviso">{mensaje}</p>}
        {error && <p className="error">{error}</p>}
        <form onSubmit={hacerCambio}>
          <label htmlFor="pin">PIN de recuperación</label>
          <input
            id="pin"
            name="pin"
            type="text"
            inputMode="numeric"
            maxLength={4}
            pattern="[0-9]{4}"
            value={formulario.pin}
            onChange={cambiar('pin')}
            placeholder="0000"
            required
          />
          <label htmlFor="pin-nueva">Nueva contraseña</label>
          <CampoPassword
            id="pin-nueva"
            name="userpswdNueva"
            value={formulario.userpswdNueva}
            onChange={cambiar('userpswdNueva')}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />
          <label htmlFor="pin-confirmar">Confirmar contraseña</label>
          <CampoPassword
            id="pin-confirmar"
            name="confirmar"
            value={formulario.confirmar}
            onChange={cambiar('confirmar')}
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
          />
          <button className="boton primario" disabled={cargando}>
            {cargando ? 'Actualizando…' : 'Actualizar contraseña'}
          </button>
        </form>
        <Link className="enlace volver" to="/login">Volver al inicio de sesión</Link>
      </section>
    </main>
  )
}
