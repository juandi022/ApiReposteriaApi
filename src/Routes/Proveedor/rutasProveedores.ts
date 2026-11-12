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

/**
 * @swagger
 * tags:
 *   name: Proveedores
 *   description: Administración de proveedores
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Proveedor:
 *       type: object
 *       properties:
 *         id_proveedor:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           maxLength: 120
 *           example: Distribuidora XYZ
 *         contacto:
 *           type: string
 *           maxLength: 120
 *           nullable: true
 *           example: Juan Pérez
 *         telefono:
 *           type: string
 *           maxLength: 20
 *           nullable: true
 *           example: '9999-9999'
 *         correo:
 *           type: string
 *           format: email
 *           maxLength: 120
 *           nullable: true
 *           example: ventas@xyz.com
 *         direccion:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           example: Col. Centro, Tegucigalpa
 *         estado:
 *           type: string
 *           enum: [Activo, Inactivo]
 *           example: Activo
 */

/**
 * @swagger
 * /api/proveedores:
 *   get:
 *     summary: Listar proveedores
 *     tags: [Proveedores]
 *     parameters:
 *       - in: query
 *         name: estado
 *         required: false
 *         description: Filtra por estado del proveedor
 *         schema:
 *           type: string
 *           enum: [Activo, Inactivo]
 *     responses:
 *       200:
 *         description: Lista de proveedores ordenada por nombre
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Proveedor'
 *       400:
 *         description: Filtro inválido
 *       500:
 *         description: Error al listar los proveedores
 */
rutasProveedores.get('/',
    query('estado')
    .optional()
    .isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser Activo o Inactivo'),
    listarProveedores
);

/**
 * @swagger
 * /api/proveedores/proveedor:
 *   get:
 *     summary: Obtener un proveedor por ID
 *     tags: [Proveedores]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID del proveedor
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Proveedor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proveedor'
 *       400:
 *         description: ID ausente o inválido
 *       404:
 *         description: No se encontró ese proveedor
 *       500:
 *         description: Error al obtener el proveedor
 */
rutasProveedores.get('/proveedor',
    query('id')
    .notEmpty().withMessage('El ID del proveedor es obligatorio')
    .isInt().withMessage('El ID del proveedor debe ser un entero'),
    obtenerProveedorPorId
);

/**
 * @swagger
 * /api/proveedores/guardar:
 *   post:
 *     summary: Crear un proveedor
 *     tags: [Proveedores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:
 *                 type: string
 *                 maxLength: 120
 *                 example: Distribuidora XYZ
 *               contacto:
 *                 type: string
 *                 maxLength: 120
 *                 example: Juan Pérez
 *               telefono:
 *                 type: string
 *                 maxLength: 20
 *                 example: '9999-9999'
 *               correo:
 *                 type: string
 *                 format: email
 *                 maxLength: 120
 *                 example: ventas@xyz.com
 *               direccion:
 *                 type: string
 *                 maxLength: 255
 *                 example: Col. Centro, Tegucigalpa
 *               estado:
 *                 type: string
 *                 enum: [Activo, Inactivo]
 *                 example: Activo
 *     responses:
 *       201:
 *         description: Proveedor creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proveedor'
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error al crear el proveedor
 */
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

/**
 * @swagger
 * /api/proveedores/actualizar:
 *   put:
 *     summary: Actualizar un proveedor
 *     description: Actualiza solo los campos enviados del proveedor indicado.
 *     tags: [Proveedores]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID del proveedor
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 maxLength: 120
 *               contacto:
 *                 type: string
 *                 maxLength: 120
 *               telefono:
 *                 type: string
 *                 maxLength: 20
 *               correo:
 *                 type: string
 *                 format: email
 *                 maxLength: 120
 *               direccion:
 *                 type: string
 *                 maxLength: 255
 *               estado:
 *                 type: string
 *                 enum: [Activo, Inactivo]
 *     responses:
 *       200:
 *         description: Proveedor actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proveedor'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Proveedor no encontrado
 *       500:
 *         description: Error al actualizar el proveedor
 */
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

/**
 * @swagger
 * /api/proveedores/eliminar:
 *   delete:
 *     summary: Eliminar un proveedor
 *     description: No se puede eliminar un proveedor que tenga compras registradas.
 *     tags: [Proveedores]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID del proveedor
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Proveedor eliminado correctamente
 *       400:
 *         description: ID ausente o inválido
 *       404:
 *         description: No se encontró ese proveedor
 *       409:
 *         description: El proveedor tiene compras registradas
 *       500:
 *         description: Error al eliminar el proveedor
 */
rutasProveedores.delete('/eliminar',
    query('id')
    .notEmpty().withMessage('El ID es obligatorio')
    .isInt().withMessage('El ID debe ser un número'),
    eliminarProveedor
);

export default rutasProveedores;
