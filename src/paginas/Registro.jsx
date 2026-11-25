import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registro } from '../api.js'
import { useEnvio } from '../auth/useEnvio.js'
import { contrasenaValida, esCorreo } from '../auth/validaciones.js'
import CampoPassword from '../componentes/CampoPassword.jsx'
import Encabezado from '../componentes/Encabezado.jsx'

const inicial = { useremail: '', username: '', userpswd: '', confirmar: '' }

export default function Registro() {
  const navegar = useNavigate()
  const [formulario, setFormulario] = useState(inicial)
  const { error, cargando, enviar, setError } = useEnvio()

  const cambiar = (campo) => (evento) => {
    setError('')
    setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }))
  }

  const hacerRegistro = (evento) =>
    enviar(evento, async () => {
      const { useremail, username, userpswd, confirmar } = formulario
      if (!esCorreo(useremail.trim())) throw new Error('Ingresa un correo electrónico válido.')
      if (username.trim().length < 3) throw new Error('El usuario debe tener al menos 3 caracteres.')
      if (!contrasenaValida(userpswd)) {
        throw new Error('La contraseña necesita 8 caracteres, una mayúscula, un número y un símbolo.')
      }
      if (userpswd !== confirmar) throw new Error('Las contraseñas no coinciden.')
      await registro(useremail.trim(), username.trim(), userpswd)
      navegar('/login', {
        replace: true,
        state: { mensaje: 'Cuenta creada correctamente. Ya puedes iniciar sesión.' },
      })
    })

  return (
    <main className="layout">
      <section className="tarjeta">
        <Encabezado titulo="Crear cuenta" subtitulo="Regístrate para acceder a la repostería" />
        {error && <p className="error">{error}</p>}
        <form onSubmit={hacerRegistro}>
          <label htmlFor="registro-email">Correo electrónico</label>
          <input
            id="registro-email"
            name="useremail"
            type="email"
            value={formulario.useremail}
            onChange={cambiar('useremail')}
            placeholder="cliente@ejemplo.com"
            autoComplete="email"
            required
          />
          <label htmlFor="registro-user">Usuario</label>
          <input
            id="registro-user"
            name="username"
            type="text"
            value={formulario.username}
            onChange={cambiar('username')}
            placeholder="tu_usuario"
            autoComplete="username"
            required
          />
          <label htmlFor="registro-pswd">Contraseña</label>
          <CampoPassword
            id="registro-pswd"
            name="userpswd"
            value={formulario.userpswd}
            onChange={cambiar('userpswd')}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />
          <label htmlFor="registro-confirmar">Confirmar contraseña</label>
          <CampoPassword
            id="registro-confirmar"
            name="confirmar"
            value={formulario.confirmar}
            onChange={cambiar('confirmar')}
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
          />
          <button className="boton primario" disabled={cargando}>
            {cargando ? 'Registrando…' : 'Registrarse'}
          </button>
        </form>
        <Link className="enlace volver" to="/login">Volver al inicio de sesión</Link>
      </section>
    </main>
  )
}
