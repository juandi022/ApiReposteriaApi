import { Router } from 'express';
import { body } from 'express-validator';
import { registrarUsuario } from '../../Controllers/Security/Registro.js';

const rutasRegistro = Router();

/**
 * @swagger
 * /api/security/registro:
 *   post:
 *     summary: Registrar un nuevo usuario (sign up)
 *     description: Crea un usuario con rol público (PLB). La contraseña se almacena cifrada y vence en 90 días.
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [useremail, username, userpswd]
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
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 usuario:
 *                   $ref: '#/components/schemas/UsuarioAutenticado'
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El correo electrónico o el nombre de usuario ya está registrado
 *       500:
 *         description: Error interno al registrar el usuario
 */
rutasRegistro.post(
    '/registro',
    body('useremail')
        .trim()
        .notEmpty().withMessage('El correo es obligatorio')
        .bail()
        .isEmail().withMessage('El correo no tiene el formato adecuado'),
    body('username')
        .trim()
        .notEmpty().withMessage('El nombre de usuario está vacío, por favor rellenarlo.')
        .bail()
        .isLength({ min: 3, max: 80 }).withMessage('El nombre de usuario debe tener entre 3 y 80 caracteres'),
    body('userpswd')
        .notEmpty().withMessage('La contraseña es obligatoria')
        .bail()
        .isStrongPassword({
            minLength: 8,
            minUppercase: 1,
            minSymbols: 1,
            minNumbers: 1,
        }).withMessage('La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.'),
    registrarUsuario
);

export default rutasRegistro;
