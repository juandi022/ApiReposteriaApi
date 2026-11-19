import dotenv from 'dotenv';
import crypto from 'crypto';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptionsWithRequest } from 'passport-jwt';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Importa tus modelos de Sequelize
import Usuario from '../Model/Usuario.js';
import Sesion from '../Model/Sesion.js';
import { obtenerRolesActivos, usuarioTieneFuncion } from './permisos.js';

dotenv.config();

const CLAVE_TOKEN: Secret = process.env.CLAVE_TOKEN || '';

if (!CLAVE_TOKEN || (typeof CLAVE_TOKEN === 'string' && CLAVE_TOKEN.length < 5)) {
  throw new Error('CLAVE_TOKEN no está definida o es demasiado corta (mínimo 5 caracteres)');
}

const ALGORITMO: jwt.Algorithm = 'HS256';
const EXPIRACION_DEFECTO = '10d';

// Valor que representa una sesión activa en la tabla 'sesiones'.
const ESTADO_SESION_ACTIVA = 'activa';

const extraerToken = ExtractJwt.fromAuthHeaderAsBearerToken();

/** Hash SHA-256 del token: es lo que se guarda en la tabla 'sesiones'. */
export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

interface TokenPayload extends jwt.JwtPayload {
  id?: number | string;
  usercod?: number | string;
  usuario?: {
    id?: number | string;
    usercod?: number | string;
  };
}

const opts: StrategyOptionsWithRequest = {
  jwtFromRequest: extraerToken,
  secretOrKey: CLAVE_TOKEN,
  algorithms: [ALGORITMO],
  passReqToCallback: true,
};

// Extender la interfaz Request de Express para que acepte la propiedad `user`
declare global {
  namespace Express {
    interface User {
      id: number | string;
      usercod: number;
      useremail: string;
      username: string;
      // `usertipo` se conserva solo como dato informativo del perfil.
      // La autorización se basa en los roles y funciones de la base de datos.
      usertipo?: string;
      roles: string[];
      userest?: string;
    }

    interface Request {
      user?: User;
    }
  }
}

passport.use(
  new JwtStrategy(opts, async (req: Request, payload: TokenPayload, done) => {
    try {
      const identificador = payload.usercod
        ?? payload.usuario?.usercod
        ?? payload.id
        ?? payload.usuario?.id
        ?? payload.sub;
      const usercod = typeof identificador === 'number'
        ? identificador
        : typeof identificador === 'string' && /^\d+$/.test(identificador)
          ? Number(identificador)
          : NaN;

      if (!Number.isSafeInteger(usercod) || usercod <= 0) {
        return done(null, false, { message: 'El token no contiene un identificador de usuario válido' });
      }

      const rawToken = extraerToken(req);
      if (!rawToken) {
        return done(null, false, { message: 'Token no proporcionado' });
      }

      // La sesión debe existir y estar activa
      const sesion = await Sesion.findOne({
        where: { usercod, token: hashToken(rawToken), estado: ESTADO_SESION_ACTIVA },
      });

      if (!sesion) {
        return done(null, false, { message: 'Sesión cerrada o no registrada. Inicie sesión nuevamente' });
      }

      const usuario = await Usuario.findByPk(usercod, {
        attributes: { exclude: ['userpswd', 'useractcod'] },
      });

      if (!usuario) {
        return done(null, false, { message: 'Usuario no encontrado' });
      }

      if (usuario.userest !== 'ACT') {
        return done(null, false, { message: 'El usuario se encuentra inactivo o deshabilitado' });
      }

      // Los roles vigentes se consultan en cada petición para que los cambios
      // en roles_usuarios/roles surtan efecto sin necesidad de reenviar el token.
      const roles = await obtenerRolesActivos(usuario.usercod);

      return done(null, {
        id: usuario.usercod,
        usercod: usuario.usercod,
        useremail: usuario.useremail,
        username: usuario.username,
        usertipo: usuario.usertipo,
        roles,
        userest: usuario.userest,
      });
    } catch (err) {
      return done(err, false);
    }
  })
);

/** Genera un token para recuperar contraseña con la expiración por defecto (10 días). */
export const getToken = (data: object): string =>
  jwt.sign(data, CLAVE_TOKEN, { algorithm: ALGORITMO, expiresIn: EXPIRACION_DEFECTO });

export interface GetTokenTiempoParams {
  datos: object;
  expirationTime: number | `${number}${'s' | 'm' | 'h' | 'd'}`;
}

/**
 * Genera un token con expiración personalizada.
 * @param params Objecto con `datos` y `expirationTime` (segundos o string como "2h", "30m")
 */
export const getTokenTiempo = ({ datos, expirationTime }: GetTokenTiempoParams): string => {
  if (!datos || typeof datos !== 'object') {
    throw new TypeError('getTokenTiempo: "datos" debe ser un objeto');
  }
  if (!expirationTime) {
    throw new TypeError('getTokenTiempo: "expirationTime" es obligatorio');
  }
  const options: SignOptions = { algorithm: ALGORITMO, expiresIn: expirationTime };
  return jwt.sign(datos, CLAVE_TOKEN, options);
};

export interface ResultadoValidacionToken {
  valido: boolean;
  payload?: any;
  motivo?: 'expirado' | 'invalido';
}

/** Verifica un token y devuelve { valido, payload } o { valido, motivo }. */
export const validarToken = (token: string): ResultadoValidacionToken => {
  try {
    const payload = jwt.verify(token, CLAVE_TOKEN, { algorithms: [ALGORITMO] });
    return { valido: true, payload };
  } catch (error: any) {
    return {
      valido: false,
      motivo: error.name === 'TokenExpiredError' ? 'expirado' : 'invalido',
    };
  }
};

/** Middleware para API REST que valida la autenticación con JWT vía Passport. */
export const validarAutenticacion = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: any, usuario: Express.User | false, info: any) => {
    if (err) {
      console.error('Error en autenticación:', err);
      res.status(500).json({ error: 'Error interno de autenticación' });
      return;
    }

    if (!usuario) {
      const expirado = info?.name === 'TokenExpiredError';
      let mensaje = 'Token no proporcionado o inválido';

      if (expirado) {
        mensaje = 'Sesión expirada';
      } else if (info?.message === 'No auth token') {
        mensaje = 'Token no proporcionado. Debe enviar la cabecera: Authorization: Bearer <token>';
      } else if (info?.message) {
        mensaje = info.message;
      }

      res.status(401).json({
        error: mensaje,
        codigo: expirado ? 'TOKEN_EXPIRADO' : 'NO_AUTENTICADO',
      });
      return;
    }

    req.user = usuario;
    next();
  })(req, res, next);
};

/**
 * Igual que `validarAutenticacion`, pero no rechaza la petición si no hay token
 * o si el token es inválido. Simplemente deja `req.user` sin definir.
 */
export const validarAutenticacionOpcional = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    next();
    return;
  }

  passport.authenticate('jwt', { session: false }, (err: any, usuario: Express.User | false) => {
    if (err) {
      console.error('Error en autenticación opcional:', err);
      next();
      return;
    }

    if (usuario) {
      req.user = usuario;
    }

    next();
  })(req, _res, next);
};

/** Respuesta común cuando la petición no tiene un usuario autenticado. */
const responderNoAutenticado = (res: Response): void => {
  res.status(401).json({
    error: 'Token no proporcionado o inválido',
    codigo: 'NO_AUTENTICADO',
  });
};

/**
 * Middleware de autorización por rol. Se usa DESPUÉS de validarAutenticacion.
 * Los roles se obtienen de roles_usuarios + roles, nunca de `usertipo`.
 */
export const permitirRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      responderNoAutenticado(res);
      return;
    }

    const rolesDelUsuario = req.user.roles ?? [];
    const autorizado = roles.length === 0
      ? rolesDelUsuario.length > 0
      : roles.some((rol) => rolesDelUsuario.includes(rol));

    if (!autorizado) {
      res.status(403).json({
        error: 'No tiene permisos para realizar esta acción',
        codigo: 'ACCESO_DENEGADO',
        rolesRequeridos: roles,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware de autorización por función. Recorre la cadena
 * roles_usuarios -> roles -> funciones_roles -> funciones en cada petición.
 * Se usa DESPUÉS de validarAutenticacion.
 */
export const requerirFuncion = (...funciones: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      responderNoAutenticado(res);
      return;
    }

    try {
      const resultados = await Promise.all(
        funciones.map((fncod) => usuarioTieneFuncion(req.user!.usercod, fncod))
      );

      if (!resultados.some(Boolean)) {
        res.status(403).json({
          error: 'No tiene permisos para realizar esta acción',
          codigo: 'FUNCION_NO_AUTORIZADA',
          funcionesRequeridas: funciones,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      res.status(500).json({ error: 'Error interno al verificar permisos' });
    }
  };
};

/** Middleware listo para proteger una ruta con autenticación + función. */
export const autorizarFuncion = (fncod: string): RequestHandler[] => [
  validarAutenticacion,
  requerirFuncion(fncod),
];

export { passport };