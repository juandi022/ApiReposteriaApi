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
 * tags:
 *   name: Funciones
 *   description: Administración de funciones del sistema
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Funcion:
 *       type: object
 *       properties:
 *         fncod:
 *           type: string
 *           maxLength: 255
 *           example: usuarios.listar
 *         fndsc:
 *           type: string
 *           maxLength: 45
 *           example: Listar usuarios
 *         fnest:
 *           type: string
 *           enum: [ACT, INA]
 *           example: ACT
 *         fntyp:
 *           type: string
 *           maxLength: 3
 *           example: MEN
 */

/**
 * @swagger
 * /api/funciones:
 *   get:
 *     summary: Listar funciones
 *     tags: [Funciones]
 *     responses:
 *       200:
 *         description: Lista de funciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Funcion'
 *       500:
 *         description: Error al listar las funciones
 */
rutasFunciones.get('/', listarFunciones);

/**
 * @swagger
 * /api/funciones/funcion:
 *   get:
 *     summary: Obtener una función por código
 *     tags: [Funciones]
 *     parameters:
 *       - in: query
 *         name: fncod
 *         required: true
 *         description: Código de la función
 *         schema:
 *           type: string
 *           maxLength: 255
 *           example: usuarios.listar
 *     responses:
 *       200:
 *         description: Función encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Funcion'
 *       400:
 *         description: Código ausente o inválido
 *       404:
 *         description: No se encontró esa función
 *       500:
 *         description: Error al obtener la función
 */
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
 *     summary: Crear una función
 *     tags: [Funciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fncod, fndsc, fnest, fntyp]
 *             properties:
 *               fncod:
 *                 type: string
 *                 maxLength: 255
 *                 example: usuarios.listar
 *               fndsc:
 *                 type: string
 *                 maxLength: 45
 *                 example: Listar usuarios
 *               fnest:
 *                 type: string
 *                 enum: [ACT, INA]
 *                 example: ACT
 *               fntyp:
 *                 type: string
 *                 maxLength: 3
 *                 example: MEN
 *     responses:
 *       201:
 *         description: Función creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Funcion'
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error al crear la función
 */
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
 *     description: Actualiza la descripción, el estado y/o el tipo de la función indicada.
 *     tags: [Funciones]
 *     parameters:
 *       - in: query
 *         name: fncod
 *         required: true
 *         description: Código de la función
 *         schema:
 *           type: string
 *           maxLength: 255
 *           example: usuarios.listar
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fndsc:
 *                 type: string
 *                 maxLength: 45
 *                 example: Listar usuarios del sistema
 *               fnest:
 *                 type: string
 *                 enum: [ACT, INA]
 *                 example: ACT
 *               fntyp:
 *                 type: string
 *                 maxLength: 3
 *                 example: MEN
 *     responses:
 *       200:
 *         description: Función actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Funcion'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Función no encontrada
 *       500:
 *         description: Error al actualizar la función
 */
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
 *         description: Código de la función
 *         schema:
 *           type: string
 *           maxLength: 255
 *           example: usuarios.listar
 *     responses:
 *       200:
 *         description: Función eliminada correctamente
 *       400:
 *         description: Código ausente o inválido
 *       404:
 *         description: No se encontró esa función
 *       500:
 *         description: Error al eliminar la función
 */
rutasFunciones.delete('/eliminar',
    query('fncod')
        .notEmpty()
        .withMessage('El código de la función es obligatorio')
        .isLength({ max: 255 })
        .withMessage('El código de la función debe tener máximo 255 caracteres'),

    eliminarFuncion
);

export default rutasFunciones;
