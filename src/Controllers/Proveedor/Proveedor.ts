import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Proveedor from "../../Model/Proveedor.js";
import Compra from "../../Model/Compra.js";

export const listarProveedores = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    try {
        // Filtros opcionales: ?estado=Activo
        const { estado } = req.query;
        const where: Record<string, unknown> = {};

        if (typeof estado === 'string' && estado !== '') {
            where.estado = estado;
        }

        const proveedores = await Proveedor.findAll({ where, order: [['nombre', 'ASC']] });
        return res.json(proveedores);
    }
    catch (error) {
        console.error('Error al listar los proveedores: ', error);
        return res.status(500).json({ error: 'Error al listar los proveedores' });
    }
};

export const obtenerProveedorPorId = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { id } = req.query;

    try {
        const proveedor = await Proveedor.findByPk(Number(id));

        if (!proveedor) {
            return res.status(404).json({ error: 'No se encontró ese proveedor' });
        }

        return res.json(proveedor);
    }
    catch (error) {
        console.error('Error al obtener el proveedor por ID: ', error);
        return res.status(500).json({ error: 'Error al obtener el proveedor por ID' });
    }
};

export const guardarProveedor = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { nombre, contacto = null, telefono = null, correo = null,
        direccion = null, estado } = req.body;

    try {
        const nuevoProveedor = await Proveedor.create({
            nombre, contacto, telefono, correo, direccion,
            ...(estado ? { estado } : {})
        });

        return res.status(201).json(nuevoProveedor);
    }
    catch (error) {
        console.error('Error al crear el proveedor: ', error);
        return res.status(500).json({ error: 'Error al crear el proveedor' });
    }
};

export const actualizarProveedor = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { id } = req.query;
    const { nombre, contacto, telefono, correo, direccion, estado } = req.body;

    try {
        const proveedor = await Proveedor.findByPk(Number(id));

        if (!proveedor) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        proveedor.nombre = nombre ?? proveedor.nombre;
        proveedor.contacto = contacto ?? proveedor.contacto;
        proveedor.telefono = telefono ?? proveedor.telefono;
        proveedor.correo = correo ?? proveedor.correo;
        proveedor.direccion = direccion ?? proveedor.direccion;
        if (estado) proveedor.estado = estado;

        await proveedor.save();

        return res.json(proveedor);
    }
    catch (error) {
        console.error('Error al actualizar el proveedor: ', error);
        return res.status(500).json({ error: 'Error al actualizar el proveedor' });
    }
};

export const eliminarProveedor = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { id } = req.query;

    try {
        const proveedor = await Proveedor.findByPk(Number(id));

        if (!proveedor) {
            return res.status(404).json({ error: 'No se encontró ese proveedor' });
        }

        // Misma regla que el proyecto en PHP: no se borra un proveedor con compras registradas
        const totalCompras = await Compra.count({ where: { id_proveedor: Number(id) } });

        if (totalCompras > 0) {
            return res.status(409).json({
                error: 'No se puede eliminar el proveedor porque tiene compras registradas'
            });
        }

        await proveedor.destroy();
        return res.json({ message: 'Proveedor eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar el proveedor: ', error);
        return res.status(500).json({ error: 'Error al eliminar el proveedor' });
    }
};
