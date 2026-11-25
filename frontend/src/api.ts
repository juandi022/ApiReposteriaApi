export interface Usuario {
  username: string;
  useremail: string;
  usertipo?: string;
}

export interface Proveedor {
  id_proveedor: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  estado: string;
}

export interface Producto {
  id_producto: number;
  nombre: string;
  stock?: number;
  precio?: number;
}

export interface DetalleCompra {
  id_detalle_compra: number;
  id_producto: number;
  producto?: string;
  cantidad: number;
  costo_unitario: number;
  subtotal: number;
}

export interface Compra {
  id_compra: number;
  numero_factura: string;
  fecha?: string;
  estado: string;
  id_proveedor: number;
  proveedor?: Proveedor;
  proveedorNombre?: string;
  subtotal?: number;
  impuesto?: number;
  total?: number;
  detalles?: DetalleCompra[];
}

export type Filtros = Record<string, string | number | boolean | null | undefined>;
export type Cuerpo = Record<string, unknown>;

export interface RespuestaMensaje {
  message?: string;
  mensaje?: string;
}

export interface RespuestaPerfil {
  usuario: Usuario;
}

export interface RespuestaLogin {
  token: string;
  usuario: Usuario;
}

type TextosError = Record<number, string>;

interface OpcionesApi {
  method?: string;
  body?: Cuerpo;
  token?: string | null;
  base?: string;
  textos?: TextosError;
}

export class ErrorApi extends Error {
  readonly data?: unknown;

  constructor(message: string, data?: unknown) {
    super(message);
    this.name = 'ErrorApi';
    this.data = data;
  }
}

export const mensajeError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const mensaje = (error as { message?: unknown }).message;
    if (typeof mensaje === 'string') return mensaje;
  }
  return 'No se pudo completar la solicitud.';
};

const BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'reposteria_token';
const BASE_SEGURIDAD = '/api/security';
const BASE_API = '/api';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

const mensajes: TextosError = {
  400: 'Revisa los datos ingresados.',
  401: 'Credenciales incorrectas.',
  403: 'No tienes acceso a esta cuenta.',
  404: 'No encontramos esa información.',
  409: 'El correo o el usuario ya está registrado.',
  429: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  500: 'Ocurrió un problema en el servidor. Inténtalo más tarde.',
};

const textoError = (item: unknown): string => {
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item !== null) {
    const detalle = item as { msg?: unknown; message?: unknown };
    const valor = detalle.msg ?? detalle.message;
    return typeof valor === 'string' ? valor : '';
  }
  return '';
};

const extraerError = async (response: Response, textos: TextosError = mensajes): Promise<ErrorApi> => {
  let data: unknown = {};
  try {
    data = await response.json();
  } catch {
    return new ErrorApi(textos[response.status] || 'No se pudo completar la solicitud.');
  }

  const objeto = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  const detalles = Array.isArray(objeto.errors)
    ? objeto.errors
    : Array.isArray(objeto.errores)
      ? objeto.errores
      : [];

  if (detalles.length > 0) {
    const mensajesDetalle = detalles.map(textoError).filter(Boolean);
    return new ErrorApi(
      mensajesDetalle.join(' ') || textos[response.status] || 'No se pudo completar la solicitud.',
      data,
    );
  }

  const mensajeDelServidor = [objeto.error, objeto.mensaje].find(
    (valor): valor is string => typeof valor === 'string' && valor.length > 0,
  );

  return new ErrorApi(
    mensajeDelServidor || textos[response.status] || 'No se pudo completar la solicitud.',
    data,
  );
};

/**
 * Cliente único para todas las peticiones. El prefijo por omisión sigue siendo
 * /api/security para no alterar el flujo de autenticación existente.
 */
export const api = async <T = unknown>(
  path: string,
  { method = 'GET', body, token, base = BASE_SEGURIDAD, textos = mensajes }: OpcionesApi = {},
): Promise<T> => {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  const authToken = token === undefined ? getToken() : token;
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(`${BASE}${base}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
  }

  if (!response.ok) throw await extraerError(response, textos);
  if (response.status === 204) return null as T;

  const texto = await response.text();
  if (!texto) return null as T;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return texto as T;
  }
};

const textosModulo: TextosError = {
  ...mensajes,
  403: 'No tienes permiso para realizar esta operación.',
  409: 'El registro ya existe o no cumple una regla de negocio.',
};

const apiModulo = <T = unknown>(path: string, opciones: Omit<OpcionesApi, 'base' | 'textos'> = {}): Promise<T> =>
  api<T>(path, { ...opciones, base: BASE_API, textos: textosModulo });

export const construirQuery = (parametros: Filtros = {}): string => {
  const query = new URLSearchParams();
  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') query.append(clave, String(valor));
  });
  const texto = query.toString();
  return texto ? `?${texto}` : '';
};

/* Autenticación (convenciones de frontend-login) */

export const iniciarSesion = (identificador: string, userpswd: string): Promise<RespuestaLogin> => {
  const campo = identificador.includes('@') ? 'useremail' : 'username';
  return api<RespuestaLogin>('/iniciarsesion', {
    method: 'POST',
    body: { [campo]: identificador, userpswd },
    token: null,
  });
};

export const registro = (useremail: string, username: string, userpswd: string): Promise<RespuestaMensaje> =>
  api<RespuestaMensaje>('/registro', { method: 'POST', body: { useremail, username, userpswd }, token: null });

export const enviarPin = (username: string, useremail: string): Promise<RespuestaMensaje> =>
  api<RespuestaMensaje>('/enviar-pin', { method: 'POST', body: { username, useremail }, token: null });

export const actualizarContrasena = (
  username: string,
  useremail: string,
  pin: string,
  userpswdNueva: string,
): Promise<RespuestaMensaje> =>
  api<RespuestaMensaje>('/actualizar-contrasena', {
    method: 'POST',
    body: { username, useremail, pin, userpswdNueva },
    token: null,
  });

export const obtenerPerfil = (): Promise<RespuestaPerfil> => api<RespuestaPerfil>('/perfil');

export const cerrarSesion = (): Promise<RespuestaMensaje> =>
  api<RespuestaMensaje>('/cerrarsesion', { method: 'POST' });

/* RED DE SUMINISTRO: proveedores */

export const listarProveedores = (filtros: Filtros = {}): Promise<Proveedor[]> =>
  apiModulo<Proveedor[]>(`/proveedores${construirQuery(filtros)}`);

export const crearProveedor = (datos: Cuerpo): Promise<Proveedor> =>
  apiModulo<Proveedor>('/proveedores/guardar', { method: 'POST', body: datos });

export const actualizarProveedor = (id: unknown, datos: Cuerpo): Promise<Proveedor> =>
  apiModulo<Proveedor>(`/proveedores/actualizar${construirQuery({ id: id as string | number })}`, {
    method: 'PUT',
    body: datos,
  });

export const eliminarProveedor = (id: unknown): Promise<null> =>
  apiModulo<null>(`/proveedores/eliminar${construirQuery({ id: id as string | number })}`, { method: 'DELETE' });

/* ABASTECIMIENTO: compras y sus detalles */

export const listarCompras = (filtros: Filtros = {}): Promise<Compra[]> =>
  apiModulo<Compra[]>(`/compras${construirQuery(filtros)}`);

export const obtenerCompra = (id: unknown): Promise<Compra> =>
  apiModulo<Compra>(`/compras/compra${construirQuery({ id: id as string | number })}`);

export const crearCompra = (datos: Cuerpo): Promise<Compra> =>
  apiModulo<Compra>('/compras/guardar', { method: 'POST', body: datos });

export const actualizarCompra = (id: unknown, datos: Cuerpo): Promise<Compra> =>
  apiModulo<Compra>(`/compras/actualizar${construirQuery({ id: id as string | number })}`, {
    method: 'PUT',
    body: datos,
  });

export const eliminarCompra = (id: unknown): Promise<null> =>
  apiModulo<null>(`/compras/eliminar${construirQuery({ id: id as string | number })}`, { method: 'DELETE' });

export const agregarDetalleCompra = (id: unknown, datos: Cuerpo): Promise<RespuestaMensaje> =>
  apiModulo<RespuestaMensaje>(`/compras/detalle/guardar${construirQuery({ id: id as string | number })}`, {
    method: 'POST',
    body: datos,
  });

export const eliminarDetalleCompra = (id: unknown, idDetalle: unknown): Promise<RespuestaMensaje> =>
  apiModulo<RespuestaMensaje>(
    `/compras/detalle/eliminar${construirQuery({ id: id as string | number, id_detalle: idDetalle as string | number })}`,
    { method: 'DELETE' },
  );

export const confirmarCompra = (id: unknown): Promise<RespuestaMensaje> =>
  apiModulo<RespuestaMensaje>(`/compras/confirmar${construirQuery({ id: id as string | number })}`, {
    method: 'PUT',
  });

/* Catálogo: solo se usa para elegir productos al registrar una compra. */

export const listarProductos = (): Promise<Producto[]> => apiModulo<Producto[]>('/catalogo');
