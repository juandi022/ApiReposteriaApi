import { Router } from 'express';
import { body } from 'express-validator';
import * as controladorAutenticacion from '../../Controllers/Security/Autenticacion.js';
import { validarAutenticacion, validarAutenticacionOpcional } from '../../Configs/passport.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Inicio de sesión y gestión de sesiones de usuario
 */

/**
 * @swagger
 * /api/security/iniciarsesion:
 *   post:
 *     summary: Iniciar sesión con contraseña o PIN
 *     description: Inicia sesión con un usuario del modelo Usuario utilizando contraseña o PIN. Tras tres intentos fallidos la cuenta se bloquea durante un minuto.
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InicioSesion'
 *           examples:
 *             conContrasena:
 *               summary: Inicio con contraseña
 *               value:
 *                 username: juan
 *                 userpswd: MiContrasena1!
 *             conPin:
 *               summary: Inicio con PIN
 *               value:
 *                 username: juan
 *                 pin: '4827'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT para usar como Bearer token en las rutas protegidas
 *                 usuario:
 *                   $ref: '#/components/schemas/UsuarioAutenticado'
 *       400:
 *         description: Falta un identificador o una credencial válida
 *       401:
 *         description: Credenciales incorrectas. La respuesta incluye `intentosRestantes`.
 *       403:
 *         description: Usuario inactivo
 *       429:
 *         description: Demasiados intentos fallidos. El inicio de sesión está bloqueado temporalmente (`segundosRestantes` y `bloqueadoHasta`).
 *       500:
 *         description: Error interno al iniciar sesión
 */
router.post(
  '/iniciarsesion',
  body('usuario').custom((_value, { req }) => {
    const identificador = req.body.useremail ?? req.body.username ?? req.body.usuario;
    if (typeof identificador !== 'string' || identificador.trim() === '') {
      throw new Error('El nombre de usuario o correo electrónico es obligatorio');
    }
    if (!req.body.userpswd && !req.body.contrasena && !req.body.pin) {
      throw new Error('Debe proporcionar una contraseña o un PIN');
    }
    return true;
  }),
  body('useremail').optional().isEmail().withMessage('El correo no es válido'),
  body('username').optional().isLength({ min: 3, max: 80 }),
  body('usuario').optional().isString(),
  body('userpswd').optional().isString().notEmpty(),
  body('contrasena').optional().isString().notEmpty(),
  body('pin').optional().matches(/^\d{4}$/).withMessage('El PIN debe tener cuatro dígitos'),
  controladorAutenticacion.iniciarSesion
);

/**
 * @swagger
 * /api/security/cerrarsesion:
 *   post:
 *     summary: Cerrar la sesión actual
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: todas
 *         schema:
 *           type: boolean
 *         description: Si es true, cierra todas las sesiones activas del usuario
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       500:
 *         description: Error al cerrar sesión
 */
router.post('/cerrarsesion', validarAutenticacion, controladorAutenticacion.cerrarSesion);

/**
 * @swagger
 * /api/security/token-prueba:
 *   post:
 *     summary: Generar un token de prueba
 *     description: Genera un JWT a partir del objeto enviado. No crea una sesión activa en la base de datos.
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usercod:
 *                 type: integer
 *               username:
 *                 type: string
 *               usertipo:
 *                 type: string
 *                 enum: [PLB, ADM, AUD]
 *     responses:
 *       200:
 *         description: Token generado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 */
router.post('/token-prueba', controladorAutenticacion.generarTokenPrueba);

/**
 * @swagger
 * /api/security/perfil:
 *   get:
 *     summary: Obtener el perfil del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   $ref: '#/components/schemas/UsuarioAutenticado'
 *       401:
 *         description: Token no proporcionado o inválido
 */
router.get('/perfil', validarAutenticacion, controladorAutenticacion.obtenerPerfil);

/**
 * @swagger
 * /api/security/enviar-pin:
 *   post:
 *     summary: Enviar un PIN temporal por correo electrónico
 *     description: Genera un PIN temporal de cuatro dígitos y lo envía al correo registrado del usuario. El PIN sirve para restablecer la contraseña y expira en 10 minutos.
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario:
 *                 type: string
 *                 description: Nombre de usuario o correo electrónico
 *               username:
 *                 type: string
 *               useremail:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: PIN enviado al correo registrado del usuario. Por seguridad el PIN no se devuelve en la respuesta.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 expiraEn:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Falta el nombre de usuario o correo electrónico
 *       403:
 *         description: Usuario inactivo
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno al generar o enviar el PIN
 */
router.post(
  '/enviar-pin',
  body('usuario').custom((_value, { req }) => {
    const identificador = req.body.useremail ?? req.body.username ?? req.body.usuario;
    if (typeof identificador !== 'string' || identificador.trim() === '') {
      throw new Error('El nombre de usuario o correo electrónico es obligatorio');
    }
    return true;
  }),
  body('useremail').optional().isEmail().withMessage('El correo no es válido'),
  body('username').optional().isLength({ min: 3, max: 80 }),
  body('usuario').optional().isString(),
  controladorAutenticacion.enviarPin
);

/**
 * @swagger
 * /api/security/actualizar-contrasena:
 *   post:
 *     summary: Actualizar la contraseña
 *     description: Permite cambiar la contraseña de dos formas. 1) Autenticado (Bearer token) indicando la contraseña actual. 2) Sin autenticación indicando el usuario (o correo) y el PIN enviado por correo con `/enviar-pin`.
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario:
 *                 type: string
 *                 description: Nombre de usuario o correo electrónico (flujo con PIN)
 *               username:
 *                 type: string
 *               useremail:
 *                 type: string
 *                 format: email
 *               pin:
 *                 type: string
 *                 pattern: '^[0-9]{4}$'
 *                 description: PIN de recuperación enviado por correo
 *               userpswdActual:
 *                 type: string
 *                 format: password
 *               userpswdNueva:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Debe incluir al menos una mayúscula, un símbolo y un número
 *               contrasenaActual:
 *                 type: string
 *                 format: password
 *                 deprecated: true
 *               nuevaContrasena:
 *                 type: string
 *                 format: password
 *                 deprecated: true
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente. Al usar PIN se invalidan el PIN y las sesiones activas.
 *       400:
 *         description: Datos inválidos, contraseña actual incorrecta o PIN inválido/expirado
 *       401:
 *         description: No autenticado y sin usuario/PIN
 *       500:
 *         description: Error al actualizar la contraseña
 */
router.post(
  '/actualizar-contrasena',
  validarAutenticacionOpcional,
  body('userpswdActual').optional().isString().notEmpty(),
  body('contrasenaActual').optional().isString().notEmpty(),
  body('pin').optional().matches(/^\d{4}$/).withMessage('El PIN debe tener cuatro dígitos'),
  body('usuario').optional().isString(),
  body('useremail').optional().isEmail().withMessage('El correo no es válido'),
  body('username').optional().isLength({ min: 3, max: 80 }),
  body('userpswdNueva').optional().isStrongPassword({
    minLength: 8,
    minUppercase: 1,
    minSymbols: 1,
    minNumbers: 1,
  }).withMessage('La nueva contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 símbolo y 1 número'),
  body('nuevaContrasena').optional().isStrongPassword({
    minLength: 8,
    minUppercase: 1,
    minSymbols: 1,
    minNumbers: 1,
  }).withMessage('La nueva contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 símbolo y 1 número'),
  body('userpswdActual').custom((_value, { req }) => {
    const nueva = req.body.userpswdNueva ?? req.body.nuevaContrasena;

    if (!nueva) {
      throw new Error('Debe proporcionar la nueva contraseña');
    }

    if (!req.user) {
      const identificador = req.body.useremail ?? req.body.username ?? req.body.usuario;
      if (!identificador || !req.body.pin) {
        throw new Error('Debe proporcionar la contraseña actual o, en su defecto, el usuario y el PIN enviado');
      }
    }

    return true;
  }),
  controladorAutenticacion.actualizarContrasena
);

/**
 * @swagger
 * components:
 *   schemas:
 *     InicioSesion:
 *       type: object
 *       properties:
 *         usuario:
 *           type: string
 *           description: Identificador; utilice usuario, username o useremail
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 80
 *         useremail:
 *           type: string
 *           format: email
 *         userpswd:
 *           type: string
 *           format: password
 *           description: Contraseña del usuario
 *         contrasena:
 *           type: string
 *           format: password
 *           deprecated: true
 *         pin:
 *           type: string
 *           pattern: '^[0-9]{4}$'
 *           description: PIN temporal de cuatro dígitos
 *     UsuarioAutenticado:
 *       type: object
 *       properties:
 *         usercod:
 *           type: integer
 *         username:
 *           type: string
 *         useremail:
 *           type: string
 *           format: email
 *         usertipo:
 *           type: string
 *           enum: [PLB, ADM, AUD]
 */

export default router;