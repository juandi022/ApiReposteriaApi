import dotenv from 'dotenv';
import crypto from 'crypto';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptionsWithRequest } from 'passport-jwt';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Importa tus modelos de Sequelize
import Usuario from '../Model/Usuario.js';
import Sesion from '../Model/Sesion.js';

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
      usertipo?: string;
      rol?: string;
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

      return done(null, {
        id: usuario.usercod,
        usercod: usuario.usercod,
        useremail: usuario.useremail,
        username: usuario.username,
        usertipo: usuario.usertipo,
        rol: usuario.usertipo,
        userest: usuario.userest,
      });
    } catch (err) {
      return done(err, false);
    }
  })
);

/** Genera un token con la expiración por defecto (10 días). */
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

/**
 * Middleware de autorización por rol. Se usa DESPUÉS de validarAutenticacion.
 */
export const permitirRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Token no proporcionado o inválido',
        codigo: 'NO_AUTENTICADO',
      });
      return;
    }

    const usertipo = req.user.usertipo ?? req.user.rol;
    if (!usertipo || !roles.includes(usertipo)) {
      res.status(403).json({
        error: 'No tiene permisos para realizar esta acción',
        codigo: 'ACCESO_DENEGADO',
      });
      return;
    }

    next();
  };
};

export { passport };