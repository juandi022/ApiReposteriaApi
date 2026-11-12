import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import Usuario from '../../Model/Usuario.js';
import Sesion from '../../Model/Sesion.js';
import IntentoLogin from '../../Model/IntentoLogin.js';
import PinRecuperacion from '../../Model/PinRecuperacion.js';
import { getToken, hashToken } from '../../Configs/passport.js';
import { correoCambiarContra } from '../../Services/correoCambiarContra.js';

// Máximo de intentos fallidos antes de bloquear el inicio de sesión.
const MAX_INTENTOS_LOGIN = Number.isFinite(Number(process.env.MAX_INTENTOS_LOGIN))
  ? Number(process.env.MAX_INTENTOS_LOGIN)
  : 3;

// Duración del bloqueo en minutos (por defecto 1 minuto).
const MINUTOS_BLOQUEO = Number.isFinite(Number(process.env.MINUTOS_BLOQUEO_LOGIN))
  ? Number(process.env.MINUTOS_BLOQUEO_LOGIN)
  : 1;

const DURACION_BLOQUEO_MS = MINUTOS_BLOQUEO * 60_000;

// Vigencia del PIN enviado por correo.
const EXPIRACION_PIN_MINUTOS = Number.isFinite(Number(process.env.EXPIRACION_PIN_MINUTOS))
  ? Number(process.env.EXPIRACION_PIN_MINUTOS)
  : 10;

const normalizarIdentificador = (identificador: string): string =>
  identificador.trim().toLowerCase();

interface EstadoBloqueo {
  bloqueado: boolean;
  bloqueadoHasta: Date | null;
  segundosRestantes: number;
}

interface ResultadoIntentoFallido extends EstadoBloqueo {
  intentosRestantes: number;
}

/** Consulta si un usuario/identificador está bloqueado y limpia bloqueos vencidos. */
const consultarBloqueo = async (clave: string): Promise<EstadoBloqueo> => {
  const registro = await IntentoLogin.findOne({ where: { clave } });

  if (!registro?.bloqueadoHasta) {
    return { bloqueado: false, bloqueadoHasta: null, segundosRestantes: 0 };
  }

  const restante = registro.bloqueadoHasta.getTime() - Date.now();

  if (restante <= 0) {
    await registro.update({ intentos: 0, bloqueadoHasta: null });
    return { bloqueado: false, bloqueadoHasta: null, segundosRestantes: 0 };
  }

  return {
    bloqueado: true,
    bloqueadoHasta: registro.bloqueadoHasta,
    segundosRestantes: Math.ceil(restante / 1000),
  };
};

/** Suma un intento fallido y bloquea la cuenta al alcanzar el máximo. */
const registrarIntentoFallido = async (clave: string): Promise<ResultadoIntentoFallido> => {
  const [registro] = await IntentoLogin.findOrCreate({
    where: { clave },
    defaults: { clave, intentos: 0, bloqueadoHasta: null },
  });

  const intentos = registro.intentos + 1;
  const bloqueadoHasta = intentos >= MAX_INTENTOS_LOGIN
    ? new Date(Date.now() + DURACION_BLOQUEO_MS)
    : null;

  await registro.update({ intentos, bloqueadoHasta });

  return {
    bloqueado: bloqueadoHasta !== null,
    bloqueadoHasta,
    segundosRestantes: bloqueadoHasta ? Math.ceil(DURACION_BLOQUEO_MS / 1000) : 0,
    intentosRestantes: Math.max(0, MAX_INTENTOS_LOGIN - intentos),
  };
};

/** Reinicia el contador de intentos cuando el inicio de sesión es correcto. */
const reiniciarIntentos = async (clave: string): Promise<void> => {
  await IntentoLogin.update(
    { intentos: 0, bloqueadoHasta: null },
    { where: { clave } }
  );
};

const responderBloqueado = (res: Response, estado: EstadoBloqueo): Response => {
  res.set('Retry-After', String(estado.segundosRestantes));
  return res.status(429).json({
    error: `Demasiados intentos fallidos. Intente nuevamente en ${estado.segundosRestantes} segundo(s).`,
    codigo: 'INICIO_SESION_BLOQUEADO',
    bloqueadoHasta: estado.bloqueadoHasta,
    segundosRestantes: estado.segundosRestantes,
  });
};

/**
 * Valida un PIN contra el último PIN de recuperación vigente.
 * Si no existe un PIN de recuperación, se mantiene la compatibilidad con
 * el PIN administrado manualmente en `useractcod`.
 */
const validarPin = async (usuario: Usuario, pin: string): Promise<boolean> => {
  const registro = await PinRecuperacion.findOne({
    where: { usercod: usuario.usercod, usado: false },
    order: [['id', 'DESC']],
  });

  if (registro) {
    return registro.expiraEn.getTime() > Date.now() && registro.pin === pin;
  }

  return usuario.useractcod === pin;
};

const validarCredencial = async (
  usuario: Usuario,
  userpswd: unknown,
  pin: unknown
): Promise<boolean> => {
  if (typeof userpswd === 'string' && userpswd.length > 0) {
    return bcrypt.compare(userpswd, usuario.userpswd);
  }

  if (typeof pin === 'string' && pin.length > 0) {
    return validarPin(usuario, pin);
  }

  return false;
};

export const iniciarSesion = async (req: Request, res: Response): Promise<Response> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const identificador = req.body.useremail ?? req.body.username ?? req.body.usuario;
  const userpswd = req.body.userpswd ?? req.body.contrasena;
  const pin = req.body.pin;

  if (typeof identificador !== 'string' || (!userpswd && !pin)) {
    return res.status(400).json({ error: 'Debe proporcionar usuario y contraseña o PIN' });
  }

  try {
    const usuarioBD = await Usuario.findOne({
      where: {
        [Op.or]: [{ username: identificador }, { useremail: identificador }],
      },
    });

    // Se usa el código de usuario cuando existe para que el bloqueo no pueda
    // evadirse alternando entre nombre de usuario y correo electrónico.
    const claveIntento = usuarioBD
      ? `usercod:${usuarioBD.usercod}`
      : `identificador:${normalizarIdentificador(identificador)}`;

    const bloqueo = await consultarBloqueo(claveIntento);
    if (bloqueo.bloqueado) {
      return responderBloqueado(res, bloqueo);
    }

    if (!usuarioBD) {
      const resultado = await registrarIntentoFallido(claveIntento);
      if (resultado.bloqueado) {
        return responderBloqueado(res, resultado);
      }
      return res.status(401).json({
        error: 'Credenciales incorrectas',
        intentosRestantes: resultado.intentosRestantes,
      });
    }

    if (usuarioBD.userest !== 'ACT') {
      return res.status(403).json({ error: 'El usuario se encuentra inactivo' });
    }

    const credencialValida = await validarCredencial(usuarioBD, userpswd, pin);

    if (!credencialValida) {
      const resultado = await registrarIntentoFallido(claveIntento);
      if (resultado.bloqueado) {
        return responderBloqueado(res, resultado);
      }
      return res.status(401).json({
        error: 'Credenciales incorrectas',
        intentosRestantes: resultado.intentosRestantes,
      });
    }

    await reiniciarIntentos(claveIntento);

    const payload = {
      usercod: usuarioBD.usercod,
      username: usuarioBD.username,
      usertipo: usuarioBD.usertipo,
    };

    const token = getToken(payload);

    await Sesion.create({
      usercod: usuarioBD.usercod,
      ip: req.ip || '127.0.0.1',
      token: hashToken(token),
      estado: 'activa',
      fechaFin: null,
    });

    return res.json({
      token,
      usuario: {
        usercod: usuarioBD.usercod,
        username: usuarioBD.username,
        useremail: usuarioBD.useremail,
        usertipo: usuarioBD.usertipo,
      },
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
};

export const cerrarSesion = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Formato de token inválido' });
    }

    const tokenHash = hashToken(token);
    const todas = req.query.todas === 'true';

    if (todas && req.user) {
      await Sesion.update(
        { estado: 'cerrada', fechaFin: new Date() },
        { where: { usercod: req.user.usercod, estado: 'activa' } }
      );
    } else {
      await Sesion.update(
        { estado: 'cerrada', fechaFin: new Date() },
        { where: { token: tokenHash, estado: 'activa' } }
      );
    }

    return res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

export const generarTokenPrueba = (req: Request, res: Response): Response => {
  const payload = req.body || { usercod: 1, username: 'usuario_admin', usertipo: 'ADM' };
  const token = getToken(payload);
  return res.json({ token });
};

export const obtenerPerfil = (req: Request, res: Response): Response => {
  return res.json({ usuario: req.user });
};

export const enviarPin = async (req: Request, res: Response): Promise<Response> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const identificador = req.body.useremail ?? req.body.username ?? req.body.usuario;
  if (typeof identificador !== 'string') {
    return res.status(400).json({ error: 'Debe proporcionar el correo o nombre de usuario' });
  }

  try {
    const usuarioBD = await Usuario.findOne({
      where: { [Op.or]: [{ username: identificador }, { useremail: identificador }] },
    });

    if (!usuarioBD) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuarioBD.userest !== 'ACT') {
      return res.status(403).json({ error: 'El usuario se encuentra inactivo' });
    }

    const pinTemporal = crypto.randomInt(1000, 10000).toString();
    const expiraEn = new Date(Date.now() + EXPIRACION_PIN_MINUTOS * 60_000);

    // Invalida los PIN anteriores y genera uno nuevo.
    await PinRecuperacion.update(
      { usado: true },
      { where: { usercod: usuarioBD.usercod, usado: false } }
    );

    await PinRecuperacion.create({
      usercod: usuarioBD.usercod,
      pin: pinTemporal,
      expiraEn,
      usado: false,
    });

    try {
      await correoCambiarContra(usuarioBD.usercod, pinTemporal, EXPIRACION_PIN_MINUTOS);
    } catch (errorCorreo) {
      console.error('Error al enviar el correo con el PIN:', errorCorreo);
      return res.status(500).json({
        error: 'No se pudo enviar el correo con el PIN. Intente nuevamente.',
      });
    }

    return res.json({
      message: 'Se envió un PIN al correo registrado del usuario.',
      expiraEn,
    });
  } catch (error) {
    console.error('Error al enviar PIN:', error);
    return res.status(500).json({ error: 'Error interno al enviar PIN' });
  }
};

export const actualizarContrasena = async (req: Request, res: Response): Promise<Response> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userpswdActual = req.body.userpswdActual ?? req.body.contrasenaActual;
  const userpswdNueva = req.body.userpswdNueva ?? req.body.nuevaContrasena;
  const pin = req.body.pin ?? req.body.codigo;
  const identificador = req.body.useremail ?? req.body.username ?? req.body.usuario;

  try {
    if (typeof userpswdNueva !== 'string' || userpswdNueva.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar la nueva contraseña' });
    }

    let usuarioBD: Usuario | null = null;
    let cambioConPin = false;

    if (req.user) {
      // Flujo autenticado: se exige la contraseña actual.
      usuarioBD = await Usuario.findByPk(req.user.usercod);

      if (!usuarioBD) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (typeof userpswdActual !== 'string' ||
        !(await bcrypt.compare(userpswdActual, usuarioBD.userpswd))) {
        return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
      }
    } else {
      // Flujo de recuperación: usuario/correo + PIN enviado por correo.
      if (typeof identificador !== 'string' || typeof pin !== 'string') {
        return res.status(401).json({
          error: 'Debe autenticarse o proporcionar el usuario (o correo) y el PIN enviado',
        });
      }

      usuarioBD = await Usuario.findOne({
        where: { [Op.or]: [{ username: identificador }, { useremail: identificador }] },
      });

      if (!usuarioBD || !(await validarPin(usuarioBD, pin))) {
        return res.status(400).json({ error: 'El PIN es inválido o ha expirado' });
      }

      cambioConPin = true;
    }

    const fechaCambio = new Date();
    const fechaExpiracion = new Date(fechaCambio);
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 90);

    await usuarioBD.update({
      userpswd: await bcrypt.hash(userpswdNueva, 10),
      userpswdchg: fechaCambio,
      userpswdexp: fechaExpiracion,
    });

    if (cambioConPin) {
      // El PIN es de un solo uso: se invalida y se cierran las sesiones activas.
      await PinRecuperacion.update(
        { usado: true },
        { where: { usercod: usuarioBD.usercod, usado: false } }
      );
      await reiniciarIntentos(`usercod:${usuarioBD.usercod}`);
      await Sesion.update(
        { estado: 'cerrada', fechaFin: new Date() },
        { where: { usercod: usuarioBD.usercod, estado: 'activa' } }
      );
    }

    return res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    return res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
};
