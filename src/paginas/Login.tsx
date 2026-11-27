import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { useEnvio } from '../auth/useEnvio'
import CampoPassword from '../componentes/CampoPassword'
import Encabezado from '../componentes/Encabezado'
import type { EstadoRuta } from '../tipos'

interface FormularioLogin {
  identificador: string
  userpswd: string
}

export default function Login() {
  const { login } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [formulario, setFormulario] = useState<FormularioLogin>({ identificador: '', userpswd: '' })
  const { error, cargando, enviar, setError } = useEnvio()

  const estado = ubicacion.state as EstadoRuta | null
  const [aviso, setAviso] = useState(estado?.mensaje || '')
  const destino = estado?.from?.pathname || '/inicio'

  useEffect(() => {
    const guardado = sessionStorage.getItem('reposteria_aviso')
    if (!guardado) return
    setAviso((actual) => actual || guardado)
    sessionStorage.removeItem('reposteria_aviso')
  }, [])

  const cambiar = (campo: keyof FormularioLogin) => (evento: ChangeEvent<HTMLInputElement>) => {
    setError('')
    setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }))
  }

  const hacerLogin = (evento: FormEvent<HTMLFormElement>) =>
    enviar(evento, async () => {
      const { identificador, userpswd } = formulario
      if (!identificador.trim() || !userpswd) throw new Error('Ingresa tu usuario y contraseña.')
      await login(identificador.trim(), userpswd)
      navegar(destino, { replace: true })
    })

  return (
    <main className="layout">
      <section className="tarjeta">
        <Encabezado
          titulo="Iniciar sesión"
          subtitulo="Ingresa tus credenciales para continuar"
        />
        {aviso && <p className="aviso">{aviso}</p>}
        {error && <p className="error">{error}</p>}
        <form onSubmit={hacerLogin}>
          <label htmlFor="identificador">Usuario o correo electrónico</label>
          <input
            id="identificador"
            name="username"
            type="text"
            value={formulario.identificador}
            onChange={cambiar('identificador')}
            placeholder="tu_usuario"
            autoComplete="username"
            required
          />
          <label htmlFor="userpswd">Contraseña</label>
          <CampoPassword
            id="userpswd"
            name="userpswd"
            value={formulario.userpswd}
            onChange={cambiar('userpswd')}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <Link className="enlace" to="/recuperacion">¿Olvidaste tu contraseña?</Link>
          <button className="boton primario" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <p className="pie">
          ¿Aún no tienes cuenta? <Link className="enlace" to="/registro">Regístrate</Link>
        </p>
      </section>
    </main>
  )
}
