import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  cerrarSesion,
  clearToken,
  getToken,
  iniciarSesion,
  obtenerPerfil,
  setToken,
} from '../api'
import { AuthContext, type AuthContextValue } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<AuthContextValue['usuario']>(null)
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
        if (activo) setUsuario(data?.usuario ?? null)
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

  const login = useCallback<AuthContextValue['login']>(async (identificador, userpswd) => {
    const data = await iniciarSesion(identificador, userpswd)
    if (!data?.token) throw new Error('El servidor no devolvió un token de acceso.')
    setToken(data.token)
    setUsuario(data.usuario ?? null)
  }, [])

  const logout = useCallback<AuthContextValue['logout']>(async () => {
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

  const valor = useMemo<AuthContextValue>(
    () => ({ usuario, verificando, login, logout }),
    [usuario, verificando, login, logout],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
