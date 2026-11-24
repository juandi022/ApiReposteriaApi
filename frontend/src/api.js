const BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'reposteria_token';
const BASE_SEGURIDAD = '/api/security';
const BASE_API = '/api';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const mensajes = {
  400: 'Revisa los datos ingresados.',
  401: 'Credenciales incorrectas.',
  403: 'No tienes acceso a esta cuenta.',
  404: 'No encontramos esa información.',
  409: 'El correo o el usuario ya está registrado.',
  429: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  500: 'Ocurrió un problema en el servidor. Inténtalo más tarde.',
};

const textoError = (item) => {
  if (typeof item === 'string') return item;
  return item?.msg || item?.message || '';
};

const extraerError = async (response, textos = mensajes) => {
const extraerError = async (response) => {
  let data = {};
  try {
    data = await response.json();
  } catch {
    return { message: textos[response.status] || 'No se pudo completar la solicitud.' };
  }

  const detalles = Array.isArray(data.errors)
    ? data.errors
    : Array.isArray(data.errores)
      ? data.errores
      : [];

  if (detalles.length) {
    const mensajesDetalle = detalles.map(textoError).filter(Boolean);
    return {
      message: mensajesDetalle.join(' ') || textos[response.status] || 'No se pudo completar la solicitud.',
      data,
    };
  }

  return {
    message: data.error || data.mensaje || textos[response.status] || 'No se pudo completar la solicitud.',
    return { message: mensajes[response.status] || 'No se pudo completar la solicitud.' };
  }
  if (Array.isArray(data.errors) && data.errors.length) {
    return { message: data.errors.map((item) => item.msg).join(' '), data };
  }
  return {
    message: data.error || mensajes[response.status] || 'No se pudo completar la solicitud.',
    data,
  };
};

/**
 * Cliente único para todas las peticiones. El prefijo por omisión sigue siendo
 * /api/security para no alterar el flujo de autenticación existente.
 */
export const api = async (path, { method = 'GET', body, token, base = BASE_SEGURIDAD, textos = mensajes } = {}) => {
export const api = async (path, { method = 'GET', body, token } = {}) => {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  const authToken = token === undefined ? getToken() : token;
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response;
  try {
    response = await fetch(`${BASE}${base}${path}`, {
    response = await fetch(`${BASE}/api/security${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
  }

  if (!response.ok) throw await extraerError(response, textos);
  if (response.status === 204) return null;

  const texto = await response.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
};

const textosModulo = {
  ...mensajes,
  403: 'No tienes permiso para realizar esta operación.',
  409: 'El registro ya existe o no cumple una regla de negocio.',
};

const apiModulo = (path, opciones = {}) =>
  api(path, { ...opciones, base: BASE_API, textos: textosModulo });

export const construirQuery = (parametros = {}) => {
  const query = new URLSearchParams();
  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') query.append(clave, String(valor));
  });
  const texto = query.toString();
  return texto ? `?${texto}` : '';
};

/* Autenticación (convenciones de frontend-login) */

  if (!response.ok) throw await extraerError(response);
  return response.json();
};

export const iniciarSesion = (identificador, userpswd) => {
  const campo = identificador.includes('@') ? 'useremail' : 'username';
  return api('/iniciarsesion', { method: 'POST', body: { [campo]: identificador, userpswd }, token: null });
};

export const registro = (useremail, username, userpswd) =>
  api('/registro', { method: 'POST', body: { useremail, username, userpswd }, token: null });

export const enviarPin = (username, useremail) =>
  api('/enviar-pin', { method: 'POST', body: { username, useremail }, token: null });

export const actualizarContrasena = (username, useremail, pin, userpswdNueva) =>
  api('/actualizar-contrasena', {
    method: 'POST',
    body: { username, useremail, pin, userpswdNueva },
    token: null,
  });

export const obtenerPerfil = () => api('/perfil');

export const cerrarSesion = () => api('/cerrarsesion', { method: 'POST' });

/* RED DE SUMINISTRO: proveedores */

export const listarProveedores = (filtros = {}) =>
  apiModulo(`/proveedores${construirQuery(filtros)}`);
export const crearProveedor = (datos) => apiModulo('/proveedores/guardar', { method: 'POST', body: datos });
export const actualizarProveedor = (id, datos) =>
  apiModulo(`/proveedores/actualizar${construirQuery({ id })}`, { method: 'PUT', body: datos });
export const eliminarProveedor = (id) =>
  apiModulo(`/proveedores/eliminar${construirQuery({ id })}`, { method: 'DELETE' });

/* ABASTECIMIENTO: compras y sus detalles */

export const listarCompras = (filtros = {}) => apiModulo(`/compras${construirQuery(filtros)}`);
export const obtenerCompra = (id) => apiModulo(`/compras/compra${construirQuery({ id })}`);
export const crearCompra = (datos) => apiModulo('/compras/guardar', { method: 'POST', body: datos });
export const actualizarCompra = (id, datos) =>
  apiModulo(`/compras/actualizar${construirQuery({ id })}`, { method: 'PUT', body: datos });
export const eliminarCompra = (id) =>
  apiModulo(`/compras/eliminar${construirQuery({ id })}`, { method: 'DELETE' });
export const agregarDetalleCompra = (id, datos) =>
  apiModulo(`/compras/detalle/guardar${construirQuery({ id })}`, { method: 'POST', body: datos });
export const eliminarDetalleCompra = (id, idDetalle) =>
  apiModulo(`/compras/detalle/eliminar${construirQuery({ id, id_detalle: idDetalle })}`, { method: 'DELETE' });
export const confirmarCompra = (id) =>
  apiModulo(`/compras/confirmar${construirQuery({ id })}`, { method: 'PUT' });

/* Catálogo: solo se usa para elegir productos al registrar una compra. */

export const listarProductos = () => apiModulo('/catalogo');
