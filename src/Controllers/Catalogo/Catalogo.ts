import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import multer from "multer";
import path from "node:path";
import { promises as fsPromises } from "node:fs";
import Producto from "../../Model/Producto.js";
import { uploadImagen, RUTA_IMAGENES } from "../../Configs/archivos.js";

// Borra un archivo del disco sin lanzar error si ya no existe
const borrarArchivo = async (ruta?: string): Promise<void> => {
    if (!ruta) return;
    await fsPromises.unlink(ruta).catch(() => { });
};

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

// POST /api/catalogo/guardar  (JSON, sin imagen; la imagen se sube después)
export const guardarProducto = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { nombre, descripcion = null, precio, stock = 0 } = req.body;

    try {
        const nuevoProducto = await Producto.create({
            nombre,
            descripcion,
            precio: String(precio),
            stock,
            imagen: null
        });

        return res.status(201).json(nuevoProducto);
    } catch (error) {
        console.error("Error al crear el producto: ", error);
        return res.status(500).json({ error: "Error al crear el producto" });
    }
};

// MIDDLEWARE: valida el id y luego deja que multer procese el archivo.
// Si algo falla (tipo inválido, archivo muy grande) responde 400 y no llega al controlador.
export const validarImagenProducto = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({ error: errors.array() });
        return;
    }

    uploadImagen(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            res.status(400).json({ error: err.message });
            return;
        } else if (err) {
            res.status(400).json({ error: err.message || "Error al procesar la imagen" });
            return;
        }
        next();
    });
};

// PUT /api/catalogo/imagen?id=1  (multipart/form-data, campo "imagen")
export const actualizarImagenProducto = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        await borrarArchivo(req.file?.path);
        return res.status(400).json({ error: errors.array() });
    }

    if (!req.file) {
        return res.status(400).json({ error: "No se ha seleccionado ninguna imagen para subir" });
    }

    const { id } = req.query;

    try {
        const producto = await Producto.findByPk(Number(id));

        if (!producto) {
            // El archivo ya se guardó en disco; si el producto no existe lo borramos
            await borrarArchivo(req.file.path);
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        // Si ya tenía imagen, borramos la anterior para no acumular archivos
        if (producto.imagen) {
            await borrarArchivo(path.join(RUTA_IMAGENES, producto.imagen));
        }

        producto.imagen = req.file.filename;
        await producto.save();

        return res.status(200).json({
            message: "Imagen actualizada exitosamente",
            producto,
            url: `${req.protocol}://${req.get("host")}/img/${req.file.filename}`
        });
    } catch (error) {
        await borrarArchivo(req.file.path);
        console.error("Error al actualizar la imagen del producto: ", error);
        return res.status(500).json({ error: "Error al actualizar la imagen del producto" });
    }
};

