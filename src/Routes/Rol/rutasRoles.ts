import { Router } from "express";
import { body, query } from "express-validator";

import {
    listarRoles,
    actualizarRol,
    eliminarRol,
    guardarRol,
    obtenerRolPorId
} from "../../Controllers/Rol/Rol.js";

const rutasRoles = Router();

// Listar roles
rutasRoles.get('/', listarRoles);

// Obtener rol por código
rutasRoles.get('/rol',
    query('rolescod')
        .notEmpty()
        .withMessage('El código del rol es obligatorio')
        .isLength({ max: 15 })
        .withMessage('El código del rol debe tener máximo 15 caracteres'),
    obtenerRolPorId
);

// Guardar rol
rutasRoles.post('/guardar',
    body('rolescod')
        .notEmpty()
        .withMessage('El código del rol es obligatorio')
        .isLength({ max: 15 })
        .withMessage('El código del rol debe tener máximo 15 caracteres'),

    body('rolesdsc')
        .notEmpty()
        .withMessage('La descripción del rol es obligatoria')
        .isLength({ max: 45 })
        .withMessage('La descripción del rol debe tener máximo 45 caracteres'),

    body('rolesest')
        .notEmpty()
        .withMessage('El estado del rol es obligatorio')
        .isLength({ max: 3 })
        .withMessage('El estado debe tener máximo tres caracteres')
        .isIn(['ACT', 'INA'])
        .withMessage('El estado debe ser ACT o INA'),

    guardarRol
);

// Actualizar rol
rutasRoles.put('/actualizar',
    query('rolescod')
        .notEmpty()
        .withMessage('El código del rol es obligatorio')
        .isLength({ max: 15 })
        .withMessage('El código del rol debe tener máximo 15 caracteres'),

    body('rolesdsc')
        .optional()
        .isLength({ max: 45 })
        .withMessage('La descripción del rol debe tener máximo 45 caracteres'),

    body('rolesest')
        .optional()
        .isLength({ max: 3 })
        .withMessage('El estado debe tener máximo tres caracteres')
        .isIn(['ACT', 'INA'])
        .withMessage('El estado debe ser ACT o INA'),

    actualizarRol
);

// Eliminar rol
rutasRoles.delete('/eliminar',
    query('rolescod')
        .notEmpty()
        .withMessage('El código del rol es obligatorio')
        .isLength({ max: 15 })
        .withMessage('El código del rol debe tener máximo 15 caracteres'),

    eliminarRol
);

export default rutasRoles;