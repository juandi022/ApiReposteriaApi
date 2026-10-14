import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Rol from "../../Model/Rol.js";

export const listarRoles = async (req: Request, res: Response): Promise<Response> => {
    try {
        const roles = await Rol.findAll();

        return res.json(roles);
    }
    catch (error) {
        console.error('Error al listar los roles: ', error);
        return res.status(500).json({
            error: 'Error al listar los roles'
        });
    }
};


export const obtenerRolPorId = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: errors.array()
        });
    }

    const { rolescod } = req.query;

    try {
        const rol = await Rol.findByPk(String(rolescod));

        if (!rol) {
            return res.status(404).json({
                error: 'No se encontró ese rol'
            });
        }

        return res.json(rol);
    }
    catch (error) {
        console.error('Error al obtener el rol: ', error);
        return res.status(500).json({
            error: 'Error al obtener el rol'
        });
    }
};


export const guardarRol = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: errors.array()
        });
    }

    const { rolescod, rolesdsc, rolesest } = req.body;

    try {
        const nuevoRol = await Rol.create({
            rolescod,
            rolesdsc,
            rolesest
        });

        return res.status(201).json(nuevoRol);
    }
    catch (error) {
        console.error('Error al crear el rol: ', error);
        return res.status(500).json({
            error: 'Error al crear el rol'
        });
    }
};


export const actualizarRol = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: errors.array()
        });
    }

    const { rolescod } = req.query;

    const { rolesdsc, rolesest } = req.body;

    try {
        const rol = await Rol.findByPk(String(rolescod));

        if (!rol) {
            return res.status(404).json({
                error: 'Rol no encontrado'
            });
        }

        rol.rolesdsc = rolesdsc ?? rol.rolesdsc;
        rol.rolesest = rolesest ?? rol.rolesest;

        await rol.save();

        return res.json(rol);
    }
    catch (error) {
        console.error('Error al actualizar el rol: ', error);
        return res.status(500).json({
            error: 'Error al actualizar el rol'
        });
    }
};


export const eliminarRol = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: errors.array()
        });
    }

    const { rolescod } = req.query;

    try {
        const rol = await Rol.findByPk(String(rolescod));

        if (!rol) {
            return res.status(404).json({
                error: 'No se encontró ese rol'
            });
        }

        await rol.destroy();

        return res.json({
            message: 'Rol eliminado correctamente'
        });
    }
    catch (error) {
        console.error('Error al eliminar el rol: ', error);
        return res.status(500).json({
            error: 'Error al eliminar el rol'
        });
    }
};