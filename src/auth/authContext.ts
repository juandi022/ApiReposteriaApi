import { createContext, useContext } from 'react'
import type { UsuarioSesion } from '../tipos'

export interface AuthContextValue {
  usuario: UsuarioSesion | null
  verificando: boolean
  login: (identificador: string, userpswd: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider.')
  return contexto
}
