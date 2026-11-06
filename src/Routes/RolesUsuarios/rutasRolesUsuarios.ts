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
 *   name: Roles Usuarios
 *   description: Administración de asignaciones de roles a usuarios
 */

/**
 * @swagger
 * /api/roles-usuarios:
 *   get:
 *     summary: Listar todas las asignaciones de roles a usuarios
 *     tags: [Roles Usuarios]
 *     responses:
 *       200:
 *         description: Lista de asignaciones obtenida correctamente
 *       500:
 *         description: Error interno del servidor
 */
router.get("/", listarRolesUsuarios);

/**
 * @swagger
 * /api/roles-usuarios/asignacion:
 *   get:
 *     summary: Obtener una asignación específica
 *     tags: [Roles Usuarios]
 *     parameters:
 *       - in: query
 *         name: usercod
 *         required: true
 *         schema:
 *           type: integer
 *         description: Código del usuario
 *       - in: query
 *         name: rolescod
 *         required: true
 *         schema:
 *           type: string
 *         description: Código del rol
 *     responses:
 *       200:
 *         description: Asignación encontrada
 *       404:
 *         description: Asignación no encontrada
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
 *     summary: Crear una asignación de rol a un usuario
 *     tags: [Roles Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usercod
 *               - rolescod
 *             properties:
 *               usercod:
 *                 type: integer
 *                 example: 1
 *               rolescod:
 *                 type: string
 *                 example: "ADMIN"
 *               roleuserest:
 *                 type: string
 *                 nullable: true
 *                 example: "ACT"
 *               roleuserfch:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2026-11-05"
 *               roleuserexp:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2027-11-05"
 *     responses:
 *       201:
 *         description: Asignación creada correctamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: La asignación ya existe
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
 *     summary: Actualizar una asignación de rol a un usuario
 *     tags: [Roles Usuarios]
 *     parameters:
 *       - in: query
 *         name: usercod
 *         required: true
 *         schema:
 *           type: integer
 *         description: Código del usuario
 *       - in: query
 *         name: rolescod
 *         required: true
 *         schema:
 *           type: string
 *         description: Código del rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleuserest:
 *                 type: string
 *                 nullable: true
 *                 example: "ACT"
 *               roleuserfch:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2026-11-05"
 *               roleuserexp:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2027-11-05"
 *     responses:
 *       200:
 *         description: Asignación actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Asignación no encontrada
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
 *     summary: Eliminar una asignación de rol a un usuario
 *     tags: [Roles Usuarios]
 *     parameters:
 *       - in: query
 *         name: usercod
 *         required: true
 *         schema:
 *           type: integer
 *         description: Código del usuario
 *       - in: query
 *         name: rolescod
 *         required: true
 *         schema:
 *           type: string
 *         description: Código del rol
 *     responses:
 *       200:
 *         description: Asignación eliminada correctamente
 *       404:
 *         description: Asignación no encontrada
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