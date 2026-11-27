import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { actualizarContrasena } from '../api'
import { useEnvio } from '../auth/useEnvio'
import { contrasenaValida } from '../auth/validaciones'
import CampoPassword from '../componentes/CampoPassword'
import Encabezado from '../componentes/Encabezado'
import type { EstadoRuta } from '../tipos'

interface FormularioContrasena {
  pin: string
  userpswdNueva: string
  confirmar: string
}

const inicial: FormularioContrasena = { pin: '', userpswdNueva: '', confirmar: '' }

export default function NuevaContrasena() {
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const estado = ubicacion.state as EstadoRuta | null
  const username = estado?.username
  const useremail = estado?.useremail
  const mensaje = estado?.mensaje
  const [formulario, setFormulario] = useState<FormularioContrasena>(inicial)
  const { error, cargando, enviar, setError } = useEnvio()

  if (!username || !useremail) return <Navigate to="/recuperacion" replace />

  const cambiar = (campo: keyof FormularioContrasena) => (evento: ChangeEvent<HTMLInputElement>) => {
    setError('')
    const valor = campo === 'pin' ? evento.target.value.replace(/\D/g, '').slice(0, 4) : evento.target.value
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  const hacerCambio = (evento: FormEvent<HTMLFormElement>) =>
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
