import { Router } from "express";
import { body, query } from "express-validator";
import {
    listarCompras,
    obtenerCompraPorId,
    guardarCompra,
    actualizarCompra,
    eliminarCompra,
    agregarDetalle,
    eliminarDetalle,
    confirmarCompra
} from "../../Controllers/Compra/Compra.js";

const rutasCompras = Router();

rutasCompras.get('/',
    query('estado')
    .optional()
    .isIn(['Borrador', 'Confirmada', 'Anulada']).withMessage('El estado debe ser Borrador, Confirmada o Anulada'),
    query('id_proveedor')
    .optional()
    .isInt().withMessage('El ID del proveedor debe ser un entero'),
    listarCompras
);

rutasCompras.get('/compra',
    query('id')
    .notEmpty().withMessage('El ID de la compra es obligatorio')
    .isInt().withMessage('El ID de la compra debe ser un entero'),
    obtenerCompraPorId
);

rutasCompras.post('/guardar',
    body('id_proveedor')
    .notEmpty().withMessage('El proveedor es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID del proveedor debe ser un entero'),
    body('numero_factura')
    .notEmpty().withMessage('El número de factura es obligatorio')
    .isLength({ max: 50 }).withMessage('El número de factura debe tener máximo 50 caracteres'),
    body('fecha')
    .optional()
    .isISO8601().withMessage('La fecha no es válida (ejemplo: 2026-10-14T10:30:00)'),
    guardarCompra
);

rutasCompras.put('/actualizar',
    query('id')
    .notEmpty().withMessage('El ID es obligatorio')
    .isInt().withMessage('El ID debe ser un número'),
    body('id_proveedor')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del proveedor debe ser un entero'),
    body('numero_factura')
    .optional()
    .notEmpty().withMessage('El número de factura no puede estar vacío')
    .isLength({ max: 50 }).withMessage('El número de factura debe tener máximo 50 caracteres'),
    body('fecha')
    .optional()
    .isISO8601().withMessage('La fecha no es válida (ejemplo: 2026-10-14T10:30:00)'),
    actualizarCompra
);

rutasCompras.delete('/eliminar',
    query('id')
    .notEmpty().withMessage('El ID es obligatorio')
    .isInt().withMessage('El ID debe ser un número'),
    eliminarCompra
);

// ----- Detalle de la compra -----

rutasCompras.post('/detalle/guardar',
    query('id')
    .notEmpty().withMessage('El ID de la compra es obligatorio')
    .isInt().withMessage('El ID de la compra debe ser un número'),
    body('id_producto')
    .notEmpty().withMessage('El producto es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID del producto debe ser un entero'),
    body('cantidad')
    .notEmpty().withMessage('La cantidad es obligatoria')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un entero mayor a cero'),
    body('costo_unitario')
    .notEmpty().withMessage('El costo unitario es obligatorio')
    .isFloat({ gt: 0 }).withMessage('El costo unitario debe ser mayor a cero'),
    agregarDetalle
);

rutasCompras.delete('/detalle/eliminar',
    query('id')
    .notEmpty().withMessage('El ID de la compra es obligatorio')
    .isInt().withMessage('El ID de la compra debe ser un número'),
    query('id_detalle')
    .notEmpty().withMessage('El ID del detalle es obligatorio')
    .isInt().withMessage('El ID del detalle debe ser un número'),
    eliminarDetalle
);

// ----- Confirmar compra (suma al stock) -----

rutasCompras.put('/confirmar',
    query('id')
    .notEmpty().withMessage('El ID es obligatorio')
    .isInt().withMessage('El ID debe ser un número'),
    confirmarCompra
);

export default rutasCompras;
