import type { AsignacionRol, RolApi, UsuarioApi } from '../interfaces/Usuario'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = Array.isArray(data.error) ? data.error.map((e: { msg?: string }) => e.msg).join(', ') : data.error || data.message || 'No se pudo completar la solicitud'
    throw new Error(detail)
  }
  return data as T
}
const json = (method: string, body?: unknown): RequestInit => ({ method, ...(body ? { body: JSON.stringify(body) } : {}) })
export const usuarioService = {
  listar: () => request<UsuarioApi[]>('/usuarios'),
  roles: () => request<RolApi[]>('/roles'),
  asignaciones: () => request<AsignacionRol[]>('/roles-usuarios'),
  crear: (body: Record<string, unknown>) => request<UsuarioApi>('/usuarios/guardar', json('POST', body)),
  actualizar: (id: number, body: Record<string, unknown>) => request<UsuarioApi>(`/usuarios/actualizar?id=${id}`, json('PUT', body)),
  eliminar: (id: number) => request<{ message: string }>(`/usuarios/eliminar?id=${id}`, { method: 'DELETE' }),
  asignarRol: (usercod: number, rolescod: string) => request('/roles-usuarios/guardar', json('POST', { usercod, rolescod, roleuserest: 'ACT' })),
  cambiarEstadoRol: (usercod: number, rolescod: string, estado: string) => request(`/roles-usuarios/actualizar?usercod=${usercod}&rolescod=${encodeURIComponent(rolescod)}`, json('PUT', { roleuserest: estado })),
  quitarRol: (usercod: number, rolescod: string) => request(`/roles-usuarios/eliminar?usercod=${usercod}&rolescod=${encodeURIComponent(rolescod)}`, { method: 'DELETE' }),
}
