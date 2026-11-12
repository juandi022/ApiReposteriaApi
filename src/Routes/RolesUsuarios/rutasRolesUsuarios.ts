import { Router } from "express";
import { body, query } from "express-validator";
import {
    listarRolesUsuarios,
    obtenerRolesUsuariosPorId,
    guardarRolesUsuarios,
    actualizarRolesUsuarios,
    eliminarRolesUsuarios
} from "../../Controllers/RolesUsuarios/RolesUsuarios.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Roles-Usuarios
 *   description: Asignación de roles a usuarios
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RolesUsuarios:
 *       type: object
 *       properties:
 *         usercod:
 *           type: integer
 *           example: 1
 *         rolescod:
 *           type: string
 *           maxLength: 15
 *           example: ADM
 *         roleuserest:
 *           type: string
 *           nullable: true
 *           example: ACT
 *         roleuserfch:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         roleuserexp:
 *           type: string
 *           format: date-time
 *           nullable: true
 */

/**
 * @swagger
 * /api/roles-usuarios:
 *   get:
 *     summary: Listar asignaciones de roles a usuarios
 *     tags: [Roles-Usuarios]
 *     responses:
 *       200:
 *         description: Lista de asignaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RolesUsuarios'
 *       500:
 *         description: Error al listar las asignaciones
 */
router.get("/", listarRolesUsuarios);

/**
 * @swagger
 * /api/roles-usuarios/asignacion:
 *   get:
 *     summary: Obtener una asignación por usuario y rol
 *     tags: [Roles-Usuarios]
 *     parameters:
 *       - in: query
 *         name: usercod
 *         required: true
 *         description: Código del usuario
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *       - in: query
 *         name: rolescod
 *         required: true
 *         description: Código del rol
 *         schema:
 *           type: string
 *           example: ADM
 *     responses:
 *       200:
 *         description: Asignación encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RolesUsuarios'
 *       400:
 *         description: Parámetros ausentes o inválidos
 *       404:
 *         description: No se encontró la asignación
 *       500:
 *         description: Error al obtener la asignación
 */
router.get(
    "/asignacion",
    [
        query("usercod").notEmpty().isInt({ min: 1 }),
        query("rolescod").notEmpty()
    ],
    obtenerRolesUsuariosPorId
);

/**
 * @swagger
 * /api/roles-usuarios/guardar:
 *   post:
 *     summary: Asignar un rol a un usuario
 *     tags: [Roles-Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usercod, rolescod]
 *             properties:
 *               usercod:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               rolescod:
 *                 type: string
 *                 maxLength: 15
 *                 example: ADM
 *               roleuserest:
 *                 type: string
 *                 nullable: true
 *                 example: ACT
 *               roleuserfch:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: '2026-01-01T00:00:00.000Z'
 *               roleuserexp:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: '2027-12-31T23:59:59.000Z'
 *     responses:
 *       201:
 *         description: Rol asignado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 datos:
 *                   $ref: '#/components/schemas/RolesUsuarios'
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El rol ya está asignado al usuario
 *       500:
 *         description: Error al asignar el rol
 */
router.post(
    "/guardar",
    [
        body("usercod").notEmpty().isInt({ min: 1 }),
        body("rolescod").notEmpty().isLength({ max: 15 }),
        body("roleuserest").optional({ nullable: true }).isLength({ min: 3, max: 3 }),
        body("roleuserfch").optional({ nullable: true }).isISO8601(),
        body("roleuserexp").optional({ nullable: true }).isISO8601()
    ],
    guardarRolesUsuarios
);

/**
 * @swagger
 * /api/roles-usuarios/actualizar:
 *   put:
 *     summary: Actualizar una asignación de rol a usuario
 *     tags: [Roles-Usuarios]
 *     parameters:
 *       - in: query
 *         name: usercod
 *         required: true
 *         description: Código del usuario
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *       - in: query
 *         name: rolescod
 *         required: true
 *         description: Código del rol
 *         schema:
 *           type: string
 *           example: ADM
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleuserest:
 *                 type: string
 *                 nullable: true
 *                 example: INA
 *               roleuserfch:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               roleuserexp:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Asignación actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 datos:
 *                   $ref: '#/components/schemas/RolesUsuarios'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: No se encontró la asignación
 *       500:
 *         description: Error al actualizar la asignación
 */
router.put(
    "/actualizar",
    [
        query("usercod").notEmpty().isInt({ min: 1 }),
        query("rolescod").notEmpty(),
        body("roleuserest").optional({ nullable: true }).isLength({ min: 3, max: 3 }),
        body("roleuserfch").optional({ nullable: true }).isISO8601(),
        body("roleuserexp").optional({ nullable: true }).isISO8601()
    ],
    actualizarRolesUsuarios
);

/**
 * @swagger
 * /api/roles-usuarios/eliminar:
 *   delete:
 *     summary: Eliminar una asignación de rol a usuario
 *     tags: [Roles-Usuarios]
 *     parameters:
 *       - in: query
 *         name: usercod
 *         required: true
 *         description: Código del usuario
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *       - in: query
 *         name: rolescod
 *         required: true
 *         description: Código del rol
 *         schema:
 *           type: string
 *           example: ADM
 *     responses:
 *       200:
 *         description: Asignación eliminada correctamente
 *       400:
 *         description: Parámetros ausentes o inválidos
 *       404:
 *         description: No se encontró la asignación
 *       500:
 *         description: Error al eliminar la asignación
 */
router.delete(
    "/eliminar",
    [
        query("usercod").notEmpty().isInt({ min: 1 }),
        query("rolescod").notEmpty()
    ],
    eliminarRolesUsuarios
);

export default router;
