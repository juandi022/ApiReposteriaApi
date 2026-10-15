import { Request, Response } from "express";
import Carrito from "../../Model/Carrito.js";
import DetalleCarrito from "../../Model/DetalleCarrito.js";
import Producto from "../../Model/Producto.js";

export const verCarrito = async (req: Request, res: Response) => {
    try {
        const usercod = Number(req.params.usercod);

        let carrito = await Carrito.findOne({
            where: { usercod, estado: "Activo" }
        });

        if (!carrito) {
            carrito = await Carrito.create({
                usercod,
                estado: "Activo"
            });
        }

        const detalles = await DetalleCarrito.findAll({
            where: { id_carrito: carrito.id_carrito }
        });

        const productos = [];

        for (const detalle of detalles) {
            const producto = await Producto.findByPk(detalle.id_producto);

            if (producto) {
                productos.push({ detalle, producto });
            }
        }

        res.json({ carrito, productos });
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener el carrito",
            error
        });
    }
};

export const agregarAlCarrito = async (req: Request, res: Response) => {
    try {
        const usercod = Number(req.body.usercod);
        const id_producto = Number(req.body.id_producto);
        const cantidad = Number(req.body.cantidad || 1);

        const producto = await Producto.findByPk(id_producto);

        if (!producto || !producto.estado) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        if (cantidad <= 0) {
            return res.status(400).json({
                mensaje: "La cantidad debe ser mayor a cero"
            });
        }

        if (cantidad > producto.stock) {
            return res.status(400).json({
                mensaje: "No hay suficiente stock"
            });
        }

        let carrito = await Carrito.findOne({
            where: { usercod, estado: "Activo" }
        });

        if (!carrito) {
            carrito = await Carrito.create({
                usercod,
                estado: "Activo"
            });
        }

        const existente = await DetalleCarrito.findOne({
            where: {
                id_carrito: carrito.id_carrito,
                id_producto
            }
        });

        if (existente) {
            existente.cantidad += cantidad;
            await existente.save();

            return res.json({
                mensaje: "Cantidad actualizada",
                detalle: existente
            });
        }

        const detalle = await DetalleCarrito.create({
            id_carrito: carrito.id_carrito,
            id_producto,
            cantidad,
            precio_unitario: producto.precio
        });

        res.status(201).json({
            mensaje: "Producto agregado al carrito",
            detalle
        });
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al agregar producto",
            error
        });
    }
};

export const quitarDelCarrito = async (req: Request, res: Response) => {
    try {
        const id_detalle_carrito = Number(req.params.id);

        const detalle = await DetalleCarrito.findByPk(id_detalle_carrito);

        if (!detalle) {
            return res.status(404).json({
                mensaje: "Producto no encontrado en el carrito"
            });
        }

        if (detalle.cantidad > 1) {
            detalle.cantidad -= 1;
            await detalle.save();

            return res.json({
                mensaje: "Cantidad reducida",
                detalle
            });
        }

        await detalle.destroy();

        res.json({
            mensaje: "Producto eliminado del carrito"
        });
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al quitar producto",
            error
        });
    }
};

export const eliminarDelCarrito = async (req: Request, res: Response) => {
    try {
        const id_detalle_carrito = Number(req.params.id);

        const detalle = await DetalleCarrito.findByPk(id_detalle_carrito);

        if (!detalle) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        await detalle.destroy();

        res.json({
            mensaje: "Producto eliminado del carrito"
        });
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al eliminar producto",
            error
        });
    }
};