import { Request, Response } from "express";
import { validationResult } from "express-validator";
import RolesUsuarios from "../../Model/RolesUsuarios.js";

export const listarRolesUsuarios = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const resultado = await RolesUsuarios.findAll();

        return res.status(200).json(resultado);
    } catch (error) {
        console.error("Error al listar roles de usuarios:", error);

        return res.status(500).json({
            error: "Error al listar los roles de usuarios"
        });
    }
};

export const obtenerRolesUsuariosPorId = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const errores = validationResult(req);

        if (!errores.isEmpty()) {
            return res.status(400).json({
                errores: errores.array()
            });
        }

        const { usercod, rolescod } = req.query;

        const asignacion = await RolesUsuarios.findOne({
            where: {
                usercod: String(usercod),
                rolescod: String(rolescod)
            }
        });

        if (!asignacion) {
            return res.status(404).json({
                error: "No se encontró la asignación del rol al usuario"
            });
        }

        return res.status(200).json(asignacion);
    } catch (error) {
        console.error("Error al obtener el rol del usuario:", error);

        return res.status(500).json({
            error: "Error al obtener la asignación del rol al usuario"
        });
    }
};

export const guardarRolesUsuarios = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const errores = validationResult(req);

        if (!errores.isEmpty()) {
            return res.status(400).json({
                errores: errores.array()
            });
        }

        const {
            usercod,
            rolescod,
            roleuserest,
            roleuserfch,
            roleuserexp
        } = req.body;

        const existente = await RolesUsuarios.findOne({
            where: {
                usercod,
                rolescod
            }
        });

        if (existente) {
            return res.status(409).json({
                error: "Este rol ya está asignado al usuario"
            });
        }

        const nuevaAsignacion = await RolesUsuarios.create({
            usercod: Number(usercod),
            rolescod,
            roleuserest: roleuserest ?? null,
            roleuserfch: roleuserfch ? new Date(roleuserfch) : null,
            roleuserexp: roleuserexp ? new Date(roleuserexp) : null
        });

        return res.status(201).json({
            mensaje: "Rol asignado al usuario correctamente",
            datos: nuevaAsignacion
        });
    } catch (error) {
        console.error("Error al guardar el rol del usuario:", error);

        return res.status(500).json({
            error: "Error al asignar el rol al usuario"
        });
    }
};

export const actualizarRolesUsuarios = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const errores = validationResult(req);

        if (!errores.isEmpty()) {
            return res.status(400).json({
                errores: errores.array()
            });
        }

        const { usercod, rolescod } = req.query;

        const {
            roleuserest,
            roleuserfch,
            roleuserexp
        } = req.body;

        const asignacion = await RolesUsuarios.findOne({
            where: {
                usercod: String(usercod),
                rolescod: String(rolescod)
            }
        });

        if (!asignacion) {
            return res.status(404).json({
                error: "No se encontró la asignación que desea actualizar"
            });
        }

        if (roleuserest !== undefined) {
            asignacion.roleuserest = roleuserest;
        }

        if (roleuserfch !== undefined) {
            asignacion.roleuserfch = roleuserfch
                ? new Date(roleuserfch)
                : null;
        }

        if (roleuserexp !== undefined) {
            asignacion.roleuserexp = roleuserexp
                ? new Date(roleuserexp)
                : null;
        }

        await asignacion.save();

        return res.status(200).json({
            mensaje: "Asignación actualizada correctamente",
            datos: asignacion
        });
    } catch (error) {
        console.error("Error al actualizar el rol del usuario:", error);

        return res.status(500).json({
            error: "Error al actualizar la asignación del rol al usuario"
        });
    }
};

export const eliminarRolesUsuarios = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const errores = validationResult(req);

        if (!errores.isEmpty()) {
            return res.status(400).json({
                errores: errores.array()
            });
        }

        const { usercod, rolescod } = req.query;

        const asignacion = await RolesUsuarios.findOne({
            where: {
                usercod: String(usercod),
                rolescod: String(rolescod)
            }
        });

        if (!asignacion) {
            return res.status(404).json({
                error: "No se encontró la asignación que desea eliminar"
            });
        }

        await asignacion.destroy();

        return res.status(200).json({
            mensaje: "Asignación eliminada correctamente"
        });
    } catch (error) {
        console.error("Error al eliminar el rol del usuario:", error);

        return res.status(500).json({
            error: "Error al eliminar la asignación del rol al usuario"
        });
    }
};