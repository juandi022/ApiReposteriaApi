import { Router } from "express";
import { body, query } from "express-validator";

import { autorizarFuncion } from "../../Configs/passport.js";
import { FUNCIONES } from "../../Configs/permisos.js";

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
 *   name: Funciones-Roles
 *   description: Asignación de funciones a roles
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FuncionesRoles:
 *       type: object
 *       properties:
 *         rolescod:
 *           type: string
 *           maxLength: 15
 *           example: ADM
 *         fncod:
 *           type: string
 *           maxLength: 255
 *           example: usuarios.listar
 *         fnrolest:
 *           type: string
 *           nullable: true
 *           example: ACT
 *         fnexp:
 *           type: string
 *           format: date-time
 *           nullable: true
 */

/**
 * @swagger
 * /api/funciones-roles:
 *   get:
 *     summary: Listar asignaciones de funciones a roles
 *     tags: [Funciones-Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       401:
 *         description: Token no proporcionado, inválido o sesión cerrada
 *       403:
 *         description: El usuario no tiene la función requerida para esta ruta
 *       200:
 *         description: Lista de asignaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FuncionesRoles'
 *       500:
 *         description: Error al listar las asignaciones
 */
router.get("/", ...autorizarFuncion(FUNCIONES.FUNCIONES_ROLES_LISTAR), listarFuncionesRoles);

/**
 * @swagger
 * /api/funciones-roles/asignacion:
 *   get:
 *     summary: Obtener una asignación por rol y función
 *     tags: [Funciones-Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rolescod
 *         required: true
 *         description: Código del rol
 *         schema:
 *           type: string
 *           example: ADM
 *       - in: query
 *         name: fncod
 *         required: true
 *         description: Código de la función
 *         schema:
 *           type: string
 *           example: usuarios.listar
 *     responses:
 *       401:
 *         description: Token no proporcionado, inválido o sesión cerrada
 *       403:
 *         description: El usuario no tiene la función requerida para esta ruta
 *       200:
 *         description: Asignación encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FuncionesRoles'
 *       400:
 *         description: Parámetros ausentes o inválidos
 *       404:
 *         description: No se encontró la asignación
 *       500:
 *         description: Error al obtener la asignación
 */
router.get(
    "/asignacion",
    ...autorizarFuncion(FUNCIONES.FUNCIONES_ROLES_OBTENER),
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
 *     summary: Asignar una función a un rol
 *     tags: [Funciones-Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rolescod, fncod]
 *             properties:
 *               rolescod:
 *                 type: string
 *                 maxLength: 15
 *                 example: ADM
 *               fncod:
 *                 type: string
 *                 maxLength: 255
 *                 example: usuarios.listar
 *               fnrolest:
 *                 type: string
 *                 nullable: true
 *                 example: ACT
 *               fnexp:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: '2027-12-31T23:59:59.000Z'
 *     responses:
 *       401:
 *         description: Token no proporcionado, inválido o sesión cerrada
 *       403:
 *         description: El usuario no tiene la función requerida para esta ruta
 *       201:
 *         description: Asignación creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 datos:
 *                   $ref: '#/components/schemas/FuncionesRoles'
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: La función ya está asignada al rol
 *       500:
 *         description: Error al guardar la asignación
 */
router.post(
    "/guardar",
    ...autorizarFuncion(FUNCIONES.FUNCIONES_ROLES_GUARDAR),
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
 *     summary: Actualizar una asignación de función y rol
 *     tags: [Funciones-Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rolescod
 *         required: true
 *         description: Código del rol
 *         schema:
 *           type: string
 *           example: ADM
 *       - in: query
 *         name: fncod
 *         required: true
 *         description: Código de la función
 *         schema:
 *           type: string
 *           example: usuarios.listar
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fnrolest:
 *                 type: string
 *                 nullable: true
 *                 example: INA
 *               fnexp:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       401:
 *         description: Token no proporcionado, inválido o sesión cerrada
 *       403:
 *         description: El usuario no tiene la función requerida para esta ruta
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
 *                   $ref: '#/components/schemas/FuncionesRoles'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: No se encontró la asignación
 *       500:
 *         description: Error al actualizar la asignación
 */
router.put(
    "/actualizar",
    ...autorizarFuncion(FUNCIONES.FUNCIONES_ROLES_ACTUALIZAR),
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
 *     summary: Eliminar una asignación de función y rol
 *     tags: [Funciones-Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rolescod
 *         required: true
 *         description: Código del rol
 *         schema:
 *           type: string
 *           example: ADM
 *       - in: query
 *         name: fncod
 *         required: true
 *         description: Código de la función
 *         schema:
 *           type: string
 *           example: usuarios.listar
 *     responses:
 *       401:
 *         description: Token no proporcionado, inválido o sesión cerrada
 *       403:
 *         description: El usuario no tiene la función requerida para esta ruta
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
    ...autorizarFuncion(FUNCIONES.FUNCIONES_ROLES_ELIMINAR),
    [
        query("rolescod").notEmpty().withMessage("El código del rol es obligatorio"),
        query("fncod").notEmpty().withMessage("El código de la función es obligatorio")
    ],
    eliminarFuncionesRoles
);

export default router;
