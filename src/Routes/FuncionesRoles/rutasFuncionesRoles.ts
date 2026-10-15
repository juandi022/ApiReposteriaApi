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

router.get("/", listarFuncionesRoles);

router.get(
    "/asignacion",
    [
        query("rolescod").notEmpty().withMessage("El código del rol es obligatorio"),
        query("fncod").notEmpty().withMessage("El código de la función es obligatorio")
    ],
    obtenerFuncionesRolesPorId
);

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

router.delete(
    "/eliminar",
    [
        query("rolescod").notEmpty().withMessage("El código del rol es obligatorio"),
        query("fncod").notEmpty().withMessage("El código de la función es obligatorio")
    ],
    eliminarFuncionesRoles
);

export default router;