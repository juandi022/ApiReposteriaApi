import type { Id, UsuarioSesion } from './tipos'

const BASE = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'reposteria_token'
const BASE_SEGURIDAD = '/api/security'
const BASE_API = '/api'

type TextosError = Record<number, string>
type DetalleError = string | { msg?: string; message?: string }

export interface RespuestaErrorApi {
  error?: string | DetalleError[]
  mensaje?: string
  message?: string
  errors?: DetalleError[]
  errores?: DetalleError[]
  [clave: string]: unknown
}

export class ErrorApi extends Error {
  data?: RespuestaErrorApi

  constructor(mensaje: string, data?: RespuestaErrorApi) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.data = data
  }
}

export interface OpcionesApi {
  method?: string
  body?: unknown
  token?: string | null
  base?: string
  textos?: TextosError
}

const mensajes: TextosError = {
  400: 'Revisa los datos ingresados.',
  401: 'Credenciales incorrectas.',
  403: 'No tienes acceso a esta cuenta.',
  404: 'No encontramos esa información.',
  409: 'El correo o el usuario ya está registrado.',
  429: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  500: 'Ocurrió un problema en el servidor. Inténtalo más tarde.',
}

const textosModulo: TextosError = {
  ...mensajes,
  403: 'No tienes permiso para realizar esta operación.',
  409: 'El registro ya existe o no cumple una regla de negocio.',
}

const textoError = (item: unknown): string => {
  if (typeof item === 'string') return item
  if (item && typeof item === 'object') {
    const detalle = item as { msg?: unknown; message?: unknown }
    if (typeof detalle.msg === 'string') return detalle.msg
    if (typeof detalle.message === 'string') return detalle.message
  }
  return ''
}

const listaDetalles = (valor: unknown): DetalleError[] =>
  Array.isArray(valor) ? (valor as DetalleError[]) : []

const extraerError = async (response: Response, textos: TextosError): Promise<ErrorApi> => {
  let data: RespuestaErrorApi = {}
  try {
    data = (await response.json()) as RespuestaErrorApi
  } catch {
    return new ErrorApi(textos[response.status] || 'No se pudo completar la solicitud.')
  }

  const detalles = [...listaDetalles(data.errors), ...listaDetalles(data.errores)]
  const mensaje =
    (detalles.length ? detalles.map(textoError).filter(Boolean).join(' ') : '') ||
    (typeof data.error === 'string' ? data.error : '') ||
    data.mensaje ||
    data.message ||
    textos[response.status] ||
    'No se pudo completar la solicitud.'

  return new ErrorApi(mensaje, data)
}

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY)

/**
 * Cliente único para todas las peticiones.
 * Por defecto usa /api/security para no alterar el flujo de autenticación.
 */
export const api = async <T = unknown>(
  path: string,
  {
    method = 'GET',
    body,
    token,
    base = BASE_SEGURIDAD,
    textos = mensajes,
  }: OpcionesApi = {},
): Promise<T | null> => {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body) headers['Content-Type'] = 'application/json'

  const authToken = token === undefined ? getToken() : token
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  let response: Response
  try {
    response = await fetch(`${BASE}${base}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté encendido.')
  }

  if (!response.ok) throw await extraerError(response, textos)
  if (response.status === 204) return null

  const texto = await response.text()
  if (!texto) return null
  try {
    return JSON.parse(texto) as T
  } catch {
    return texto as T
  }
}

const apiModulo = <T = unknown>(path: string, opciones: OpcionesApi = {}) =>
  api<T>(path, { ...opciones, base: BASE_API, textos: textosModulo })

export const construirQuery = (parametros: Record<string, unknown> = {}): string => {
  const query = new URLSearchParams()
  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') query.append(clave, String(valor))
  })
  const texto = query.toString()
  return texto ? `?${texto}` : ''
}

/* Autenticación */

export interface RespuestaLogin {
  token?: string
  usuario?: UsuarioSesion
}

export const iniciarSesion = (identificador: string, userpswd: string) => {
  const campo = identificador.includes('@') ? 'useremail' : 'username'
  return api<RespuestaLogin>('/iniciarsesion', {
    method: 'POST',
    body: { [campo]: identificador, userpswd },
    token: null,
  })
}

export const registro = (useremail: string, username: string, userpswd: string) =>
  api<unknown>('/registro', { method: 'POST', body: { useremail, username, userpswd }, token: null })

export const enviarPin = (username: string, useremail: string) =>
  api<unknown>('/enviar-pin', { method: 'POST', body: { username, useremail }, token: null })

export const actualizarContrasena = (
  username: string,
  useremail: string,
  pin: string,
  userpswdNueva: string,
) =>
  api<unknown>('/actualizar-contrasena', {
    method: 'POST',
    body: { username, useremail, pin, userpswdNueva },
    token: null,
  })

export const obtenerPerfil = () => api<{ usuario?: UsuarioSesion }>('/perfil')
export const cerrarSesion = () => api<unknown>('/cerrarsesion', { method: 'POST' })

/* Red de suministro: proveedores */

export const listarProveedores = (filtros: Record<string, unknown> = {}) =>
  apiModulo(`/proveedores${construirQuery(filtros)}`)
export const crearProveedor = (datos: Record<string, unknown>) =>
  apiModulo('/proveedores/guardar', { method: 'POST', body: datos })
export const actualizarProveedor = (id: Id, datos: Record<string, unknown>) =>
  apiModulo(`/proveedores/actualizar${construirQuery({ id })}`, { method: 'PUT', body: datos })
export const eliminarProveedor = (id: Id) =>
  apiModulo(`/proveedores/eliminar${construirQuery({ id })}`, { method: 'DELETE' })

/* Abastecimiento: compras y sus detalles */

export const listarCompras = (filtros: Record<string, unknown> = {}) =>
  apiModulo(`/compras${construirQuery(filtros)}`)
export const obtenerCompra = (id: Id) => apiModulo(`/compras/compra${construirQuery({ id })}`)
export const crearCompra = (datos: Record<string, unknown>) =>
  apiModulo('/compras/guardar', { method: 'POST', body: datos })
export const actualizarCompra = (id: Id, datos: Record<string, unknown>) =>
  apiModulo(`/compras/actualizar${construirQuery({ id })}`, { method: 'PUT', body: datos })
export const eliminarCompra = (id: Id) =>
  apiModulo(`/compras/eliminar${construirQuery({ id })}`, { method: 'DELETE' })
export const agregarDetalleCompra = (id: Id, datos: Record<string, unknown>) =>
  apiModulo(`/compras/detalle/guardar${construirQuery({ id })}`, { method: 'POST', body: datos })
export const eliminarDetalleCompra = (id: Id, idDetalle: Id) =>
  apiModulo(`/compras/detalle/eliminar${construirQuery({ id, id_detalle: idDetalle })}`, {
    method: 'DELETE',
  })
export const confirmarCompra = (id: Id) =>
  apiModulo<{ message?: string }>(`/compras/confirmar${construirQuery({ id })}`, { method: 'PUT' })

/* Catálogo: solo se usa para elegir productos al registrar una compra */

export const listarProductos = () => apiModulo('/catalogo')
