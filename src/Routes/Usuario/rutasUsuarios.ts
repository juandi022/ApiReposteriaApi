import { Router } from "express";
import { body, query } from "express-validator";
import { listarUsuarios, actualizarUsuario, eliminarUsuario, guardarUsuario, obtenerUsuarioPorId } from "../../Controllers/Usuario/Usuario.js";

const rutasUsuarios = Router();

rutasUsuarios.get('/', listarUsuarios);

rutasUsuarios.get('/usuario',
    query('id')
    .notEmpty().withMessage('El ID del usuario es obligatorio')
    .isInt().withMessage('El ID del usuario debe ser un entero'),
    obtenerUsuarioPorId
);

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

rutasUsuarios.delete('/eliminar',
    query('id')
    .notEmpty().withMessage('El ID es obligatorio')
    .isInt().withMessage('El ID debe ser un número'),
    eliminarUsuario
);

export default rutasUsuarios;