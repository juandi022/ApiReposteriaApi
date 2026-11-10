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
 * /api/roles:
 *   get:
 *     summary: Listar todos los roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Lista de roles obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rol'
 *       500:
 *         description: Error al listar los roles
 */

// Listar roles
rutasRoles.get('/', listarRoles);

/**
 * @swagger
 * /api/roles/rol:
 *   get:
 *     summary: Obtener un rol por su código
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: rolescod
 *         required: true
 *         schema:
 *           type: string
 *         description: Código del rol
 *     responses:
 *       200:
 *         description: Rol encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rol'
 *       400:
 *         description: Código inválido o faltante
 *       404:
 *         description: No se encontró ese rol
 */

// Obtener rol por código
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
 *     summary: Registrar un nuevo rol
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rolescod
 *               - rolesdsc
 *               - rolesest
 *             properties:
 *               rolescod:
 *                 type: string
 *                 example: ADMIN
 *               rolesdsc:
 *                 type: string
 *                 example: Administrador del sistema
 *               rolesest:
 *                 type: string
 *                 enum: [ACT, INA]
 *                 example: ACT
 *     responses:
 *       201:
 *         description: Rol creado correctamente
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error al crear el rol
 */

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

/**
 * @swagger
 * /api/roles/actualizar:
 *   put:
 *     summary: Actualizar un rol
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: rolescod
 *         required: true
 *         schema:
 *           type: string
 *         description: Código del rol que se actualizará
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rolesdsc:
 *                 type: string
 *                 example: Administrador actualizado
 *               rolesest:
 *                 type: string
 *                 enum: [ACT, INA]
 *                 example: ACT
 *     responses:
 *       200:
 *         description: Rol actualizado correctamente
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Rol no encontrado
 */

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
 *         schema:
 *           type: string
 *         description: Código del rol
 *     responses:
 *       200:
 *         description: Rol eliminado correctamente
 *       400:
 *         description: Código inválido o faltante
 *       404:
 *         description: No se encontró ese rol
 */

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