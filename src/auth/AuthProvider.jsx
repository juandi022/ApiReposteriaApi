import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  cerrarSesion,
  clearToken,
  getToken,
  iniciarSesion,
  obtenerPerfil,
  setToken,
} from '../api.js'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    let activo = true

    if (!getToken()) {
      setVerificando(false)
      return () => {
        activo = false
      }
    }

    obtenerPerfil()
      .then((data) => {
        if (activo) setUsuario(data?.usuario || null)
      })
      .catch(() => {
        clearToken()
      })
      .finally(() => {
        if (activo) setVerificando(false)
      })

    return () => {
      activo = false
    }
  }, [])

  const login = useCallback(async (identificador, userpswd) => {
    const data = await iniciarSesion(identificador, userpswd)
    if (!data?.token) throw new Error('El servidor no devolvió un token de acceso.')
    setToken(data.token)
    setUsuario(data.usuario || null)
  }, [])

  const logout = useCallback(async () => {
    try {
      await cerrarSesion()
    } catch {
      // La sesión local se cierra aunque el backend no responda.
    } finally {
      clearToken()
      sessionStorage.setItem('reposteria_aviso', 'Cerraste sesión correctamente.')
      setUsuario(null)
    }
  }, [])

  const valor = useMemo(
    () => ({ usuario, verificando, login, logout }),
    [usuario, verificando, login, logout],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
