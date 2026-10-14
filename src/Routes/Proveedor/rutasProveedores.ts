import { Router } from "express";
import { body, query } from "express-validator";
import {
    listarProveedores,
    obtenerProveedorPorId,
    guardarProveedor,
    actualizarProveedor,
    eliminarProveedor
} from "../../Controllers/Proveedor/Proveedor.js";

const rutasProveedores = Router();

rutasProveedores.get('/',
    query('estado')
    .optional()
    .isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser Activo o Inactivo'),
    listarProveedores
);

rutasProveedores.get('/proveedor',
    query('id')
    .notEmpty().withMessage('El ID del proveedor es obligatorio')
    .isInt().withMessage('El ID del proveedor debe ser un entero'),
    obtenerProveedorPorId
);

rutasProveedores.post('/guardar',
    body('nombre')
    .notEmpty().withMessage('El nombre del proveedor es obligatorio')
    .isLength({ max: 120 }).withMessage('El nombre debe tener máximo 120 caracteres'),
    body('contacto')
    .optional()
    .isLength({ max: 120 }).withMessage('El contacto debe tener máximo 120 caracteres'),
    body('telefono')
    .optional()
    .isLength({ max: 20 }).withMessage('El teléfono debe tener máximo 20 caracteres'),
    body('correo')
    .optional()
    .isEmail().withMessage('El correo no es válido')
    .isLength({ max: 120 }).withMessage('El correo debe tener máximo 120 caracteres'),
    body('direccion')
    .optional()
    .isLength({ max: 255 }).withMessage('La dirección debe tener máximo 255 caracteres'),
    body('estado')
    .optional()
    .isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser Activo o Inactivo'),
    guardarProveedor
);

rutasProveedores.put('/actualizar',
    query('id')
    .notEmpty().withMessage('El ID es obligatorio')
    .isInt().withMessage('El ID debe ser un número'),
    body('nombre')
    .optional()
    .notEmpty().withMessage('El nombre del proveedor no puede estar vacío')
    .isLength({ max: 120 }).withMessage('El nombre debe tener máximo 120 caracteres'),
    body('contacto')
    .optional()
    .isLength({ max: 120 }).withMessage('El contacto debe tener máximo 120 caracteres'),
    body('telefono')
    .optional()
    .isLength({ max: 20 }).withMessage('El teléfono debe tener máximo 20 caracteres'),
    body('correo')
    .optional()
    .isEmail().withMessage('El correo no es válido')
    .isLength({ max: 120 }).withMessage('El correo debe tener máximo 120 caracteres'),
    body('direccion')
    .optional()
    .isLength({ max: 255 }).withMessage('La dirección debe tener máximo 255 caracteres'),
    body('estado')
    .optional()
    .isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser Activo o Inactivo'),
    actualizarProveedor
);

rutasProveedores.delete('/eliminar',
    query('id')
    .notEmpty().withMessage('El ID es obligatorio')
    .isInt().withMessage('El ID debe ser un número'),
    eliminarProveedor
);

export default rutasProveedores;
