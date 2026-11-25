import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { enviarPin } from '../api.js'
import { useEnvio } from '../auth/useEnvio.js'
import { esCorreo } from '../auth/validaciones.js'
import Encabezado from '../componentes/Encabezado.jsx'

export default function Recuperacion() {
  const navegar = useNavigate()
  const [formulario, setFormulario] = useState({ username: '', useremail: '' })
  const { error, cargando, enviar, setError } = useEnvio()

  const cambiar = (campo) => (evento) => {
    setError('')
    setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }))
  }

  const hacerRecuperacion = (evento) =>
    enviar(evento, async () => {
      const { username, useremail } = formulario
      if (username.trim().length < 3) throw new Error('El usuario debe tener al menos 3 caracteres.')
      if (!esCorreo(useremail.trim())) throw new Error('Ingresa un correo electrónico válido.')
      await enviarPin(username.trim(), useremail.trim())
      navegar('/nueva-contrasena', {
        replace: true,
        state: {
          username: username.trim(),
          useremail: useremail.trim(),
          mensaje: 'Enviamos un PIN de 4 dígitos a tu correo.',
        },
      })
    })

  return (
    <main className="layout">
      <section className="tarjeta">
        <Encabezado
          titulo="Recuperar contraseña"
          subtitulo="Ingresa tu usuario y correo para continuar"
        />
        {error && <p className="error">{error}</p>}
        <form onSubmit={hacerRecuperacion}>
          <label htmlFor="rec-user">Usuario</label>
          <input
            id="rec-user"
            name="username"
            type="text"
            value={formulario.username}
            onChange={cambiar('username')}
            placeholder="tu_usuario"
            autoComplete="username"
            required
          />
          <label htmlFor="rec-email">Correo electrónico</label>
          <input
            id="rec-email"
            name="useremail"
            type="email"
            value={formulario.useremail}
            onChange={cambiar('useremail')}
            placeholder="cliente@ejemplo.com"
            autoComplete="email"
            required
          />
          <button className="boton primario" disabled={cargando}>
            {cargando ? 'Enviando…' : 'Continuar'}
          </button>
        </form>
        <Link className="enlace volver" to="/login">Volver al inicio de sesión</Link>
      </section>
    </main>
  )
}
