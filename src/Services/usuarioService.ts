import type { AsignacionRol, RolApi, UsuarioApi } from '../interfaces/Usuario'

const API_URL = import.meta.env.VITE_API_URL || '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('reposteria_token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const texto = await response.text()
  const data = texto ? JSON.parse(texto) : {}

  if (!response.ok) {
    const detalle = Array.isArray(data.error)
      ? data.error.map((item: { msg?: string }) => item.msg).join(', ')
      : data.error || data.message || 'No se pudo completar la solicitud'
    throw new Error(detalle)
  }

  return data as T
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body ? { body: JSON.stringify(body) } : {}),
})

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
