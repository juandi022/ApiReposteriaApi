import { Router } from "express";
import { body, query } from "express-validator";

import {
    listarFunciones,
    actualizarFuncion,
    eliminarFuncion,
    guardarFuncion,
    obtenerFuncionPorId
} from "../../Controllers/Funcion/Funcion.js";

const rutasFunciones = Router();

/**
 * @swagger
 * /api/funciones:
 *   get:
 *     summary: Listar todas las funciones
 *     tags: [Funciones]
 *     responses:
 *       200:
 *         description: Lista de funciones obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Funcion'
 *       500:
 *         description: Error al listar las funciones
 */


// Listar todas las funciones
rutasFunciones.get('/', listarFunciones);

/**
 * @swagger
 * /api/funciones/funcion:
 *   get:
 *     summary: Obtener una función por su código
 *     tags: [Funciones]
 *     parameters:
 *       - in: query
 *         name: fncod
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de la función
 *     responses:
 *       200:
 *         description: Función encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Funcion'
 *       400:
 *         description: Código inválido o faltante
 *       404:
 *         description: No se encontró esa función
 */

// Obtener función por código
rutasFunciones.get('/funcion',
    query('fncod')
        .notEmpty()
        .withMessage('El código de la función es obligatorio')
        .isLength({ max: 255 })
        .withMessage('El código de la función debe tener máximo 255 caracteres'),
    obtenerFuncionPorId
);

/**
 * @swagger
 * /api/funciones/guardar:
 *   post:
 *     summary: Registrar una nueva función
 *     tags: [Funciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fncod
 *               - fndsc
 *               - fnest
 *               - fntyp
 *             properties:
 *               fncod:
 *                 type: string
 *                 example: PRODUCTOS
 *               fndsc:
 *                 type: string
 *                 example: Administración de productos
 *               fnest:
 *                 type: string
 *                 enum: [ACT, INA]
 *                 example: ACT
 *               fntyp:
 *                 type: string
 *                 example: MNT
 *     responses:
 *       201:
 *         description: Función creada correctamente
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error al crear la función
 */

// Guardar función
rutasFunciones.post('/guardar',
    body('fncod')
        .notEmpty()
        .withMessage('El código de la función es obligatorio')
        .isLength({ max: 255 })
        .withMessage('El código de la función debe tener máximo 255 caracteres'),

    body('fndsc')
        .notEmpty()
        .withMessage('La descripción de la función es obligatoria')
        .isLength({ max: 45 })
        .withMessage('La descripción debe tener entre 1 y 45 caracteres'),

    body('fnest')
        .notEmpty()
        .withMessage('El estado de la función es obligatorio')
        .isLength({ max: 3 })
        .withMessage('El estado debe tener máximo tres caracteres')
        .isIn(['ACT', 'INA'])
        .withMessage('El estado debe ser ACT o INA'),

    body('fntyp')
        .notEmpty()
        .withMessage('El tipo de función es obligatorio')
        .isLength({ max: 3 })
        .withMessage('El tipo de función debe tener máximo tres caracteres'),

    guardarFuncion
);

/**
 * @swagger
 * /api/funciones/actualizar:
 *   put:
 *     summary: Actualizar una función
 *     tags: [Funciones]
 *     parameters:
 *       - in: query
 *         name: fncod
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de la función que se actualizará
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fndsc:
 *                 type: string
 *                 example: Administración actualizada
 *               fnest:
 *                 type: string
 *                 enum: [ACT, INA]
 *                 example: ACT
 *               fntyp:
 *                 type: string
 *                 example: MNT
 *     responses:
 *       200:
 *         description: Función actualizada correctamente
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Función no encontrada
 */

// Actualizar función
rutasFunciones.put('/actualizar',
    query('fncod')
        .notEmpty()
        .withMessage('El código de la función es obligatorio')
        .isLength({ max: 255 })
        .withMessage('El código de la función debe tener máximo 255 caracteres'),

    body('fndsc')
        .optional()
        .isLength({ max: 45 })
        .withMessage('La descripción debe tener máximo 45 caracteres'),

    body('fnest')
        .optional()
        .isLength({ max: 3 })
        .withMessage('El estado debe tener máximo tres caracteres')
        .isIn(['ACT', 'INA'])
        .withMessage('El estado debe ser ACT o INA'),

    body('fntyp')
        .optional()
        .isLength({ max: 3 })
        .withMessage('El tipo de función debe tener máximo tres caracteres'),

    actualizarFuncion
);

/**
 * @swagger
 * /api/funciones/eliminar:
 *   delete:
 *     summary: Eliminar una función
 *     tags: [Funciones]
 *     parameters:
 *       - in: query
 *         name: fncod
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de la función
 *     responses:
 *       200:
 *         description: Función eliminada correctamente
 *       400:
 *         description: Código inválido o faltante
 *       404:
 *         description: Función no encontrada
 */

// Eliminar función
rutasFunciones.delete('/eliminar',
    query('fncod')
        .notEmpty()
        .withMessage('El código de la función es obligatorio')
        .isLength({ max: 255 })
        .withMessage('El código de la función debe tener máximo 255 caracteres'),

    eliminarFuncion
);
export default rutasFunciones;