import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { Op } from "sequelize";
import FuncionesRoles from "../../Model/FuncionesRoles.js";

export const listarFuncionesRoles = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const resultado = await FuncionesRoles.findAll();

        return res.status(200).json(resultado);
    } catch (error) {
        console.error("Error al listar funciones y roles:", error);

        return res.status(500).json({
            error: "Error al listar las funciones y roles"
        });
    }
};

export const obtenerFuncionesRolesPorId = async (
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

        const { rolescod, fncod } = req.query;

        const asignacion = await FuncionesRoles.findOne({
            where: {
                rolescod: String(rolescod),
                fncod: String(fncod)
            }
        });

        if (!asignacion) {
            return res.status(404).json({
                error: "No se encontró la asignación de función y rol"
            });
        }

        return res.status(200).json(asignacion);
    } catch (error) {
        console.error("Error al obtener la asignación:", error);

        return res.status(500).json({
            error: "Error al obtener la asignación de función y rol"
        });
    }
};

export const guardarFuncionesRoles = async (
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

        const { rolescod, fncod, fnrolest, fnexp } = req.body;

        const existente = await FuncionesRoles.findOne({
            where: {
                rolescod,
                fncod
            }
        });

        if (existente) {
            return res.status(409).json({
                error: "Esta función ya está asignada al rol"
            });
        }

        const nuevaAsignacion = await FuncionesRoles.create({
            rolescod,
            fncod,
            fnrolest: fnrolest ?? null,
            fnexp: fnexp ? new Date(fnexp) : null
        });

        return res.status(201).json({
            mensaje: "Asignación creada correctamente",
            datos: nuevaAsignacion
        });
    } catch (error) {
        console.error("Error al guardar la asignación:", error);

        return res.status(500).json({
            error: "Error al guardar la asignación de función y rol"
        });
    }
};

export const actualizarFuncionesRoles = async (
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

        const { rolescod, fncod } = req.query;
        const { fnrolest, fnexp } = req.body;

        const asignacion = await FuncionesRoles.findOne({
            where: {
                rolescod: String(rolescod),
                fncod: String(fncod)
            }
        });

        if (!asignacion) {
            return res.status(404).json({
                error: "No se encontró la asignación que desea actualizar"
            });
        }

        if (fnrolest !== undefined) {
            asignacion.fnrolest = fnrolest;
        }

        if (fnexp !== undefined) {
            asignacion.fnexp = fnexp ? new Date(fnexp) : null;
        }

        await asignacion.save();

        return res.status(200).json({
            mensaje: "Asignación actualizada correctamente",
            datos: asignacion
        });
    } catch (error) {
        console.error("Error al actualizar la asignación:", error);

        return res.status(500).json({
            error: "Error al actualizar la asignación de función y rol"
        });
    }
};

export const eliminarFuncionesRoles = async (
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

        const { rolescod, fncod } = req.query;

        const asignacion = await FuncionesRoles.findOne({
            where: {
                rolescod: String(rolescod),
                fncod: String(fncod)
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
        console.error("Error al eliminar la asignación:", error);

        return res.status(500).json({
            error: "Error al eliminar la asignación de función y rol"
        });
    }
};