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

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Administración de roles
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Rol:
 *       type: object
 *       properties:
 *         rolescod:
 *           type: string
 *           maxLength: 15
 *           example: ADM
 *         rolesdsc:
 *           type: string
 *           maxLength: 45
 *           example: Administrador
 *         rolesest:
 *           type: string
 *           enum: [ACT, INA]
 *           example: ACT
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Listar roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Lista de roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rol'
 *       500:
 *         description: Error al listar los roles
 */
rutasRoles.get('/', listarRoles);

/**
 * @swagger
 * /api/roles/rol:
 *   get:
 *     summary: Obtener un rol por código
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: rolescod
 *         required: true
 *         description: Código del rol
 *         schema:
 *           type: string
 *           maxLength: 15
 *           example: ADM
 *     responses:
 *       200:
 *         description: Rol encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rol'
 *       400:
 *         description: Código ausente o inválido
 *       404:
 *         description: No se encontró ese rol
 *       500:
 *         description: Error al obtener el rol
 */
rutasRoles.get('/rol',
    query('rolescod')
        .notEmpty()
        .withMessage('El código del rol es obligatorio')
        .isLength({ max: 15 })
        .withMessage('El código del rol debe tener máximo 15 caracteres'),
    obtenerRolPorId
);

/**
 * @swagger
 * /api/roles/guardar:
 *   post:
 *     summary: Crear un rol
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rolescod, rolesdsc, rolesest]
 *             properties:
 *               rolescod:
 *                 type: string
 *                 maxLength: 15
 *                 example: ADM
 *               rolesdsc:
 *                 type: string
 *                 maxLength: 45
 *                 example: Administrador
 *               rolesest:
 *                 type: string
 *                 enum: [ACT, INA]
 *                 example: ACT
 *     responses:
 *       201:
 *         description: Rol creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rol'
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error al crear el rol
 */
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

/**
 * @swagger
 * /api/roles/actualizar:
 *   put:
 *     summary: Actualizar un rol
 *     description: Actualiza la descripción y/o el estado del rol indicado.
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: rolescod
 *         required: true
 *         description: Código del rol
 *         schema:
 *           type: string
 *           maxLength: 15
 *           example: ADM
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rolesdsc:
 *                 type: string
 *                 maxLength: 45
 *                 example: Administrador general
 *               rolesest:
 *                 type: string
 *                 enum: [ACT, INA]
 *                 example: ACT
 *     responses:
 *       200:
 *         description: Rol actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rol'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Rol no encontrado
 *       500:
 *         description: Error al actualizar el rol
 */
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

/**
 * @swagger
 * /api/roles/eliminar:
 *   delete:
 *     summary: Eliminar un rol
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: rolescod
 *         required: true
 *         description: Código del rol
 *         schema:
 *           type: string
 *           maxLength: 15
 *           example: ADM
 *     responses:
 *       200:
 *         description: Rol eliminado correctamente
 *       400:
 *         description: Código ausente o inválido
 *       404:
 *         description: No se encontró ese rol
 *       500:
 *         description: Error al eliminar el rol
 */
rutasRoles.delete('/eliminar',
    query('rolescod')
        .notEmpty()
        .withMessage('El código del rol es obligatorio')
        .isLength({ max: 15 })
        .withMessage('El código del rol debe tener máximo 15 caracteres'),

    eliminarRol
);

export default rutasRoles;
