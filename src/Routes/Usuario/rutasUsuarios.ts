import { Router } from "express";
import { body, query } from "express-validator";
import { listarUsuarios, actualizarUsuario, eliminarUsuario, guardarUsuario, obtenerUsuarioPorId } from "../../Controllers/Usuario/Usuario.js";

const rutasUsuarios = Router();

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Administración de usuarios
 */

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Listar usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       500:
 *         description: Error al listar los usuarios
 */
rutasUsuarios.get('/', listarUsuarios);

/**
 * @swagger
 * /api/usuarios/usuario:
 *   get:
 *     summary: Obtener un usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID entero del usuario
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: ID ausente o inválido
 *       404:
 *         description: No se encontró ese usuario
 *       500:
 *         description: Error al obtener el usuario
 */
rutasUsuarios.get('/usuario',
    query('id')
    .notEmpty().withMessage('El ID del usuario es obligatorio')
    .isInt().withMessage('El ID del usuario debe ser un entero'),
    obtenerUsuarioPorId
);

/**
 * @swagger
 * /api/usuarios/guardar:
 *   post:
 *     summary: Registrar un usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [useremail, username, userpswd, userpswdest, userest]
 *             properties:
 *               useremail:
 *                 type: string
 *                 format: email
 *                 example: cliente@ejemplo.com
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 80
 *                 example: cliente
 *               userpswd:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Debe incluir al menos una mayúscula, un símbolo y un número
 *                 example: ClaveSegura1!
 *               userpswdest:
 *                 type: string
 *                 maxLength: 3
 *                 description: Estado de la contraseña
 *                 example: ACT
 *               userest:
 *                 type: string
 *                 maxLength: 3
 *                 description: Estado del usuario
 *                 example: ACT
 *               useractcod:
 *                 type: string
 *                 description: Código de activación opcional
 *               usertipo:
 *                 type: string
 *                 maxLength: 3
 *                 enum: [PLB, ADM, AUD]
 *     responses:
 *       201:
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error al crear el usuario
 */
rutasUsuarios.post('/guardar',
    body('useremail')
    .isEmail().withMessage('El email no es válido')
    .notEmpty().withMessage('El email es obligatorio'),
    body('username')
    .notEmpty().withMessage('El nombre de usuario es obligatorio')
    .isLength({ min: 3, max: 80 }).withMessage('El nombre de usuario debe tener entre 3 y 80 caracteres'),
    body('userpswd')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isStrongPassword({
        minLength: 8,
        minUppercase: 1,
        minSymbols: 1,
        minNumbers: 1
    }).withMessage('La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 símobolo y 1 número'),
    body('userpswdest')
    .notEmpty().withMessage('El estado es obligatorio')
    .isLength({max: 3 }).withMessage('El estado debe tener máximo tres caracteres'),
    body('userest')
    .notEmpty().withMessage('El estado es obligatorio')
    .isLength({max: 3 }).withMessage('El estado debe tener máximo tres caracteres'),
    body('useractcod'),
    body('usertipo'),
    guardarUsuario
);

/**
 * @swagger
 * /api/usuarios/actualizar:
 *   put:
 *     summary: Actualizar un usuario
 *     description: Actualiza los campos enviados para el usuario indicado.
 *     tags: [Usuarios]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID entero del usuario
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               useremail:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 80
 *               userpswd:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Debe incluir al menos una mayúscula, un símbolo y un número
 *               userpswdest:
 *                 type: string
 *                 maxLength: 3
 *               userest:
 *                 type: string
 *                 maxLength: 3
 *               useractcod:
 *                 type: string
 *                 maxLength: 128
 *               usertipo:
 *                 type: string
 *                 maxLength: 3
 *                 enum: [PLB, ADM, AUD]
 *               userfching:
 *                 type: string
 *                 format: date-time
 *               userpswdexp:
 *                 type: string
 *                 format: date
 *               userpswdchg:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: ID o datos inválidos
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al actualizar el usuario
 */
rutasUsuarios.put('/actualizar',
    query('id')
    .notEmpty().withMessage('El ID es obligatorio')
    .isInt().withMessage('El ID debe ser un número'),
    body('useremail')
    .optional()
    .isEmail().withMessage('El email no es válido'),
    body('username')
    .optional()
    .isLength({ min: 3, max: 80 }).withMessage('El nombre de usuario debe tener entre 3 y 80 caracteres'),
    body('userpswd')
    .optional()
    .isStrongPassword({
        minLength: 8,
        minUppercase: 1,
        minSymbols: 1,
        minNumbers: 1
    }).withMessage('La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 símobolo y 1 número'),
    body('userpswdest')
    .optional()
    .isLength({max: 3 }).withMessage('El estado debe tener máximo tres caracteres'),
    body('userest')
    .optional()
    .isLength({max: 3 }).withMessage('El estado debe tener máximo tres caracteres'),
    body('useractcod')
    .optional()
    .isLength({max: 128 }).withMessage('El estado debe tener máximo tres caracteres'),
    body('usertipo')
    .optional()
    .isLength({max: 3 }).withMessage('El estado debe tener máximo tres caracteres'),
    actualizarUsuario
);

/**
 * @swagger
 * /api/usuarios/eliminar:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID entero del usuario
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario eliminado correctamente
 *       400:
 *         description: ID ausente o inválido
 *       404:
 *         description: No se encontró ese usuario
 *       500:
 *         description: Error al eliminar el usuario
 */
rutasUsuarios.delete('/eliminar',
    query('id')
    .notEmpty().withMessage('El ID es obligatorio')
    .isInt().withMessage('El ID debe ser un número'),
    eliminarUsuario
);

export default rutasUsuarios;