import { Request, Response } from "express";
import Producto from "../../Model/Producto.js";

export const listarProductos = async (req: Request, res: Response) => {
    try {
        const productos = await Producto.findAll({
            where: { estado: true }
        });

        res.json(productos);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener los productos",
            error
        });
    }
};

export const obtenerProducto = async (req: Request, res: Response) => {
    try {
        const producto = await Producto.findByPk(Number(req.params.id));

        if (!producto || !producto.estado) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        res.json(producto);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener el producto",
            error
        });
    }
};