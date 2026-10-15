import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Funcion from "../../Model/Funcion.js";

export const listarFunciones = async (req: Request, res: Response): Promise<Response> => {
    try {
        const funciones = await Funcion.findAll();

        return res.json(funciones);
    }
    catch (error) {
        console.error('Error al listar las funciones: ', error);
        return res.status(500).json({ error: 'Error al listar las funciones' });
    }
};


export const obtenerFuncionPorId = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { fncod } = req.query;

    try {
        const funcion = await Funcion.findByPk(String(fncod));

        if (!funcion) {
            return res.status(404).json({
                error: 'No se encontró esa función'
            });
        }

        return res.json(funcion);
    }
    catch (error) {
        console.error('Error al obtener la función por código: ', error);
        return res.status(500).json({
            error: 'Error al obtener la función por código'
        });
    }
};


export const guardarFuncion = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { fncod, fndsc, fnest, fntyp } = req.body;

    try {
        const nuevaFuncion = await Funcion.create({
            fncod,
            fndsc,
            fnest,
            fntyp
        });

        return res.status(201).json(nuevaFuncion);
    }
    catch (error) {
        console.error('Error al crear la función: ', error);
        return res.status(500).json({
            error: 'Error al crear la función'
        });
    }
};


export const actualizarFuncion = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { fncod } = req.query;

    const { fndsc, fnest, fntyp } = req.body;

    try {
        const funcion = await Funcion.findByPk(String(fncod));

        if (!funcion) {
            return res.status(404).json({
                error: 'Función no encontrada'
            });
        }

        funcion.fndsc = fndsc ?? funcion.fndsc;
        funcion.fnest = fnest ?? funcion.fnest;
        funcion.fntyp = fntyp ?? funcion.fntyp;

        await funcion.save();

        return res.json(funcion);
    }
    catch (error) {
        console.error('Error al actualizar la función: ', error);
        return res.status(500).json({
            error: 'Error al actualizar la función'
        });
    }
};


export const eliminarFuncion = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { fncod } = req.query;

    try {
        const funcion = await Funcion.findByPk(String(fncod));

        if (!funcion) {
            return res.status(404).json({
                error: 'No se encontró esa función'
            });
        }

        await funcion.destroy();

        return res.json({
            message: 'Función eliminada correctamente'
        });
    }
    catch (error) {
        console.error('Error al eliminar la función: ', error);
        return res.status(500).json({
            error: 'Error al eliminar la función'
        });
    }
};