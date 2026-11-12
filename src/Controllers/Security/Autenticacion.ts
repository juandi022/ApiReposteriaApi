import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import Usuario from '../../Model/Usuario.js';
import Sesion from '../../Model/Sesion.js';
import { getToken, hashToken } from '../../Configs/passport.js';

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

    if (!usuarioBD) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (usuarioBD.userest !== 'ACT') {
      return res.status(403).json({ error: 'El usuario se encuentra inactivo' });
    }

    let credencialValida = false;
    if (typeof userpswd === 'string') {
      credencialValida = await bcrypt.compare(userpswd, usuarioBD.userpswd);
    } else if (typeof pin === 'string' && usuarioBD.useractcod === pin) {
      credencialValida = true;
    }

    if (!credencialValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

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

    const pinTemporal = crypto.randomInt(1000, 10000).toString();
    await usuarioBD.update({ useractcod: pinTemporal });

    return res.json({ message: 'PIN temporal generado', pin: pinTemporal });
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
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuarioBD = await Usuario.findByPk(req.user.usercod);
    if (!usuarioBD || typeof userpswdActual !== 'string' ||
      !(await bcrypt.compare(userpswdActual, usuarioBD.userpswd))) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    if (typeof userpswdNueva !== 'string') {
      return res.status(400).json({ error: 'Debe proporcionar la nueva contraseña' });
    }

    const fechaCambio = new Date();
    const fechaExpiracion = new Date(fechaCambio);
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 90);

    await usuarioBD.update({
      userpswd: await bcrypt.hash(userpswdNueva, 10),
      userpswdchg: fechaCambio,
      userpswdexp: fechaExpiracion,
    });
    return res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    return res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
};