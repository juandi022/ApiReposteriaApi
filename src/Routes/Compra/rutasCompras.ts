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

/**
 * @swagger
 * tags:
 *   name: Compras
 *   description: Gestión de compras a proveedores y sus detalles
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Compra:
 *       type: object
 *       properties:
 *         id_compra:
 *           type: integer
 *           example: 10
 *         id_proveedor:
 *           type: integer
 *           example: 1
 *         fecha:
 *           type: string
 *           format: date-time
 *         numero_factura:
 *           type: string
 *           maxLength: 50
 *           example: F-0001
 *         subtotal:
 *           type: string
 *           example: '100.00'
 *         impuesto:
 *           type: string
 *           example: '15.00'
 *         total:
 *           type: string
 *           example: '115.00'
 *         estado:
 *           type: string
 *           enum: [Borrador, Confirmada, Anulada]
 *           example: Borrador
 *         proveedor:
 *           type: object
 *           description: Datos resumidos del proveedor
 *           properties:
 *             id_proveedor:
 *               type: integer
 *             nombre:
 *               type: string
 *     DetalleCompra:
 *       type: object
 *       properties:
 *         id_detalle_compra:
 *           type: integer
 *           example: 1
 *         id_compra:
 *           type: integer
 *           example: 10
 *         id_producto:
 *           type: integer
 *           example: 3
 *         producto:
 *           type: string
 *           description: Nombre del producto, solo presente al consultar la compra por ID
 *         cantidad:
 *           type: integer
 *           example: 2
 *         costo_unitario:
 *           type: string
 *           example: '25.00'
 *         subtotal:
 *           type: string
 *           example: '50.00'
 */

/**
 * @swagger
 * /api/compras:
 *   get:
 *     summary: Listar compras
 *     tags: [Compras]
 *     parameters:
 *       - in: query
 *         name: estado
 *         required: false
 *         description: Filtra por estado de la compra
 *         schema:
 *           type: string
 *           enum: [Borrador, Confirmada, Anulada]
 *       - in: query
 *         name: id_proveedor
 *         required: false
 *         description: Filtra por proveedor
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de compras con el proveedor incluido
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Compra'
 *       400:
 *         description: Filtros inválidos
 *       500:
 *         description: Error al listar las compras
 */
rutasCompras.get('/',
    query('estado')
    .optional()
    .isIn(['Borrador', 'Confirmada', 'Anulada']).withMessage('El estado debe ser Borrador, Confirmada o Anulada'),
    query('id_proveedor')
    .optional()
    .isInt().withMessage('El ID del proveedor debe ser un entero'),
    listarCompras
);

/**
 * @swagger
 * /api/compras/compra:
 *   get:
 *     summary: Obtener una compra por ID con sus detalles
 *     tags: [Compras]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID de la compra
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Compra con proveedor y detalles
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Compra'
 *                 - type: object
 *                   properties:
 *                     detalles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DetalleCompra'
 *       400:
 *         description: ID ausente o inválido
 *       404:
 *         description: No se encontró esa compra
 *       500:
 *         description: Error al obtener la compra
 */
rutasCompras.get('/compra',
    query('id')
    .notEmpty().withMessage('El ID de la compra es obligatorio')
    .isInt().withMessage('El ID de la compra debe ser un entero'),
    obtenerCompraPorId
);

/**
 * @swagger
 * /api/compras/guardar:
 *   post:
 *     summary: Crear una compra en estado Borrador
 *     tags: [Compras]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_proveedor, numero_factura]
 *             properties:
 *               id_proveedor:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               numero_factura:
 *                 type: string
 *                 maxLength: 50
 *                 example: F-0001
 *               fecha:
 *                 type: string
 *                 format: date-time
 *                 example: '2026-10-14T10:30:00.000Z'
 *     responses:
 *       201:
 *         description: Compra creada en borrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Compra'
 *       400:
 *         description: Datos inválidos o proveedor inactivo
 *       404:
 *         description: El proveedor indicado no existe
 *       409:
 *         description: Ya existe una compra con ese número de factura para el proveedor
 *       500:
 *         description: Error al crear la compra
 */
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

/**
 * @swagger
 * /api/compras/actualizar:
 *   put:
 *     summary: Actualizar una compra en Borrador
 *     tags: [Compras]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID de la compra
 *         schema:
 *           type: integer
 *           example: 10
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_proveedor:
 *                 type: integer
 *                 minimum: 1
 *               numero_factura:
 *                 type: string
 *                 maxLength: 50
 *               fecha:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Compra actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Compra'
 *       400:
 *         description: Datos inválidos o proveedor inactivo
 *       404:
 *         description: Compra o proveedor no encontrado
 *       409:
 *         description: La compra no está en borrador o la factura está duplicada
 *       500:
 *         description: Error al actualizar la compra
 */
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

/**
 * @swagger
 * /api/compras/eliminar:
 *   delete:
 *     summary: Eliminar una compra en Borrador
 *     description: Solo se pueden eliminar compras en estado Borrador. También elimina sus detalles.
 *     tags: [Compras]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID de la compra
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Compra eliminada correctamente
 *       400:
 *         description: ID ausente o inválido
 *       404:
 *         description: No se encontró esa compra
 *       409:
 *         description: Solo se pueden eliminar compras en borrador
 *       500:
 *         description: Error al eliminar la compra
 */
rutasCompras.delete('/eliminar',
    query('id')
    .notEmpty().withMessage('El ID es obligatorio')
    .isInt().withMessage('El ID debe ser un número'),
    eliminarCompra
);

/**
 * @swagger
 * /api/compras/detalle/guardar:
 *   post:
 *     summary: Agregar un producto a una compra en Borrador
 *     description: Recalcula automáticamente el subtotal, impuesto (15%) y total de la compra.
 *     tags: [Compras]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID de la compra
 *         schema:
 *           type: integer
 *           example: 10
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_producto, cantidad, costo_unitario]
 *             properties:
 *               id_producto:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               costo_unitario:
 *                 type: number
 *                 exclusiveMinimum: 0
 *                 example: 25.00
 *     responses:
 *       201:
 *         description: Detalle agregado y totales recalculados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 detalle:
 *                   $ref: '#/components/schemas/DetalleCompra'
 *                 compra:
 *                   $ref: '#/components/schemas/Compra'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Compra o producto no encontrado
 *       409:
 *         description: La compra no está en borrador
 *       500:
 *         description: Error al agregar el detalle
 */
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

/**
 * @swagger
 * /api/compras/detalle/eliminar:
 *   delete:
 *     summary: Eliminar un detalle de una compra en Borrador
 *     description: Recalcula automáticamente los totales de la compra.
 *     tags: [Compras]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID de la compra
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: id_detalle
 *         required: true
 *         description: ID del detalle de compra
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Detalle eliminado y totales recalculados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 compra:
 *                   $ref: '#/components/schemas/Compra'
 *       400:
 *         description: Parámetros ausentes o inválidos
 *       404:
 *         description: Compra o detalle no encontrado
 *       409:
 *         description: La compra no está en borrador
 *       500:
 *         description: Error al eliminar el detalle
 */
rutasCompras.delete('/detalle/eliminar',
    query('id')
    .notEmpty().withMessage('El ID de la compra es obligatorio')
    .isInt().withMessage('El ID de la compra debe ser un número'),
    query('id_detalle')
    .notEmpty().withMessage('El ID del detalle es obligatorio')
    .isInt().withMessage('El ID del detalle debe ser un número'),
    eliminarDetalle
);

/**
 * @swagger
 * /api/compras/confirmar:
 *   put:
 *     summary: Confirmar una compra y actualizar el inventario
 *     description: Pasa la compra de Borrador a Confirmada, suma las cantidades al stock de cada producto y envía un correo al proveedor.
 *     tags: [Compras]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID de la compra
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Compra confirmada. Indica si el correo al proveedor se envió correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 correo_enviado:
 *                   type: boolean
 *                 compra:
 *                   $ref: '#/components/schemas/Compra'
 *       400:
 *         description: La compra no tiene detalles
 *       404:
 *         description: No se encontró esa compra
 *       409:
 *         description: La compra ya fue procesada
 *       500:
 *         description: Error al confirmar la compra
 */
rutasCompras.put('/confirmar',
    query('id')
    .notEmpty().withMessage('El ID es obligatorio')
    .isInt().withMessage('El ID debe ser un número'),
    confirmarCompra
);

export default rutasCompras;
