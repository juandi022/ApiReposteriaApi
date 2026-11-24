const BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'reposteria_token';

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

const extraerError = async (response) => {
  let data = {};
  try {
    data = await response.json();
  } catch {
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

export const api = async (path, { method = 'GET', body, token } = {}) => {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  const authToken = token === undefined ? getToken() : token;
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response;
  try {
    response = await fetch(`${BASE}/api/security${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
  }

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
