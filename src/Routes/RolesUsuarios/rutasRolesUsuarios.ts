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

router.get("/", listarRolesUsuarios);

router.get(
    "/asignacion",
    [
        query("usercod").notEmpty().isInt({ min: 1 }),
        query("rolescod").notEmpty()
    ],
    obtenerRolesUsuariosPorId
);

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

router.delete(
    "/eliminar",
    [
        query("usercod").notEmpty().isInt({ min: 1 }),
        query("rolescod").notEmpty()
    ],
    eliminarRolesUsuarios
);

export default router;