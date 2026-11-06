import { Router } from "express";
import { body, query } from "express-validator";

import {
    listarFuncionesRoles,
    obtenerFuncionesRolesPorId,
    guardarFuncionesRoles,
    actualizarFuncionesRoles,
    eliminarFuncionesRoles
} from "../../Controllers/FuncionesRoles/FuncionesRoles.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Funciones Roles
 *   description: Administración de funciones asignadas a roles
 */

/**
 * @swagger
 * /api/funciones-roles:
 *   get:
 *     summary: Listar todas las funciones asignadas a roles
 *     tags: [Funciones Roles]
 *     responses:
 *       200:
 *         description: Lista de asignaciones obtenida correctamente
 *       500:
 *         description: Error interno del servidor
 */
router.get("/", listarFuncionesRoles);

/**
 * @swagger
 * /api/funciones-roles/asignacion:
 *   get:
 *     summary: Obtener una asignación específica
 *     tags: [Funciones Roles]
 *     parameters:
 *       - in: query
 *         name: rolescod
 *         required: true
 *         schema:
 *           type: string
 *         description: Código del rol
 *       - in: query
 *         name: fncod
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de la función
 *     responses:
 *       200:
 *         description: Asignación encontrada
 *       404:
 *         description: Asignación no encontrada
 */
router.get(
    "/asignacion",
    [
        query("rolescod").notEmpty().withMessage("El código del rol es obligatorio"),
        query("fncod").notEmpty().withMessage("El código de la función es obligatorio")
    ],
    obtenerFuncionesRolesPorId
);

/**
 * @swagger
 * /api/funciones-roles/guardar:
 *   post:
 *     summary: Crear una asignación de función a un rol
 *     tags: [Funciones Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rolescod
 *               - fncod
 *             properties:
 *               rolescod:
 *                 type: string
 *                 maxLength: 15
 *                 example: "ADMIN"
 *               fncod:
 *                 type: string
 *                 maxLength: 255
 *                 example: "GESTION_USUARIOS"
 *               fnrolest:
 *                 type: string
 *                 nullable: true
 *                 example: "ACT"
 *               fnexp:
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
        body("rolescod")
            .notEmpty()
            .withMessage("El código del rol es obligatorio")
            .isLength({ max: 15 })
            .withMessage("El código del rol no puede superar 15 caracteres"),

        body("fncod")
            .notEmpty()
            .withMessage("El código de la función es obligatorio")
            .isLength({ max: 255 })
            .withMessage("El código de la función no puede superar 255 caracteres"),

        body("fnrolest")
            .optional({ nullable: true })
            .isLength({ min: 3, max: 3 })
            .withMessage("El estado debe tener 3 caracteres"),

        body("fnexp")
            .optional({ nullable: true })
            .isISO8601()
            .withMessage("La fecha de expiración debe ser válida")
    ],
    guardarFuncionesRoles
);

/**
 * @swagger
 * /api/funciones-roles/actualizar:
 *   put:
 *     summary: Actualizar una asignación de función a un rol
 *     tags: [Funciones Roles]
 *     parameters:
 *       - in: query
 *         name: rolescod
 *         required: true
 *         schema:
 *           type: string
 *         description: Código del rol
 *       - in: query
 *         name: fncod
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de la función
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fnrolest:
 *                 type: string
 *                 nullable: true
 *                 example: "ACT"
 *               fnexp:
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
        query("rolescod").notEmpty().withMessage("El código del rol es obligatorio"),
        query("fncod").notEmpty().withMessage("El código de la función es obligatorio"),

        body("fnrolest")
            .optional({ nullable: true })
            .isLength({ min: 3, max: 3 })
            .withMessage("El estado debe tener 3 caracteres"),

        body("fnexp")
            .optional({ nullable: true })
            .isISO8601()
            .withMessage("La fecha de expiración debe ser válida")
    ],
    actualizarFuncionesRoles
);

/**
 * @swagger
 * /api/funciones-roles/eliminar:
 *   delete:
 *     summary: Eliminar una asignación de función a un rol
 *     tags: [Funciones Roles]
 *     parameters:
 *       - in: query
 *         name: rolescod
 *         required: true
 *         schema:
 *           type: string
 *         description: Código del rol
 *       - in: query
 *         name: fncod
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de la función
 *     responses:
 *       200:
 *        description: Asignación eliminada correctamente
 *       404:
 *         description: Asignación no encontrada
 */
router.delete(
    "/eliminar",
    [
        query("rolescod").notEmpty().withMessage("El código del rol es obligatorio"),
        query("fncod").notEmpty().withMessage("El código de la función es obligatorio")
    ],
    eliminarFuncionesRoles
);

export default router; 