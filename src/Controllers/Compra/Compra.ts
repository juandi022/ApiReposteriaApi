import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { QueryTypes, Transaction, UniqueConstraintError } from "sequelize";
import db from "../../Configs/db.js";
import Compra, { EstadoCompra } from "../../Model/Compra.js";
import DetalleCompra from "../../Model/DetalleCompra.js";
import Proveedor, { EstadoProveedor } from "../../Model/Proveedor.js";
import { enviarCorreo } from "../../Configs/correo.js";
import { correoCompra } from "../../Services/correoCompra.js";


const IMPUESTO = 0.15;

// Error para reglas de negocio (se responde con el status indicado en lugar de un 500)
class ErrorNegocio extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

const manejarError = (res: Response, error: unknown, mensaje: string): Response => {
    if (error instanceof ErrorNegocio) {
        return res.status(error.status).json({ error: error.message });
    }

    if (error instanceof UniqueConstraintError) {
        return res.status(409).json({
            error: 'Ya existe una compra con ese número de factura para este proveedor'
        });
    }

    console.error(mensaje + ': ', error);
    return res.status(500).json({ error: mensaje });
};

// Suma los detalles y actualiza subtotal, impuesto y total de la compra
const recalcularTotales = async (idCompra: number, t: Transaction): Promise<void> => {
    const subtotal = Number(await DetalleCompra.sum('subtotal', {
        where: { id_compra: idCompra },
        transaction: t
    })) || 0;

    const impuesto = Math.round(subtotal * IMPUESTO * 100) / 100;
    const total = subtotal + impuesto;

    await Compra.update(
        {
            subtotal: subtotal.toFixed(2),
            impuesto: impuesto.toFixed(2),
            total: total.toFixed(2)
        },
        { where: { id_compra: idCompra, estado: EstadoCompra.BORRADOR }, transaction: t }
    );
};

// Busca la compra y valida que exista y siga en Borrador
const obtenerCompraBorrador = async (idCompra: number, t: Transaction): Promise<Compra> => {
    const compra = await Compra.findByPk(idCompra, { transaction: t, lock: t.LOCK.UPDATE });

    if (!compra) {
        throw new ErrorNegocio(404, 'Compra no encontrada');
    }

    if (compra.estado !== EstadoCompra.BORRADOR) {
        throw new ErrorNegocio(409, 'Solo se pueden modificar compras en borrador');
    }

    return compra;
};

export const listarCompras = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    try {
        // Filtros opcionales: ?estado=Borrador&id_proveedor=1
        const { estado, id_proveedor } = req.query;
        const where: Record<string, unknown> = {};

        if (typeof estado === 'string' && estado !== '') where.estado = estado;
        if (typeof id_proveedor === 'string' && id_proveedor !== '') where.id_proveedor = Number(id_proveedor);

        const compras = await Compra.findAll({
            where,
            include: [{ model: Proveedor, as: 'proveedor', attributes: ['id_proveedor', 'nombre'] }],
            order: [['id_compra', 'DESC']]
        });

        return res.json(compras);
    }
    catch (error) {
        return manejarError(res, error, 'Error al listar las compras');
    }
};

export const obtenerCompraPorId = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { id } = req.query;

    try {
        const compra = await Compra.findByPk(Number(id), {
            include: [{ model: Proveedor, as: 'proveedor', attributes: ['id_proveedor', 'nombre'] }]
        });

        if (!compra) {
            return res.status(404).json({ error: 'No se encontró esa compra' });
        }

        // El nombre del producto se trae con SQL directo porque el modelo de productos es de otro módulo
        const detalles = await db.query(
            `SELECT d.id_detalle_compra, d.id_compra, d.id_producto, p.nombre AS producto,
                    d.cantidad, d.costo_unitario, d.subtotal
             FROM detalle_compra d
             INNER JOIN productos p ON d.id_producto = p.id_producto
             WHERE d.id_compra = :id_compra
             ORDER BY d.id_detalle_compra ASC`,
            { replacements: { id_compra: Number(id) }, type: QueryTypes.SELECT }
        );

        return res.json({ ...compra.toJSON(), detalles });
    }
    catch (error) {
        return manejarError(res, error, 'Error al obtener la compra por ID');
    }
};

export const guardarCompra = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { id_proveedor, numero_factura, fecha } = req.body;

    try {
        const proveedor = await Proveedor.findByPk(Number(id_proveedor));
        

        if (!proveedor) {
            return res.status(404).json({ error: 'El proveedor indicado no existe' });
        }

        if (proveedor.estado !== EstadoProveedor.ACTIVO) {
            return res.status(400).json({ error: 'El proveedor indicado está inactivo' });
        }

        // La compra siempre nace en Borrador con totales en 0 (los totales salen de los detalles)
        const nuevaCompra = await Compra.create({
            id_proveedor: Number(id_proveedor),
            numero_factura,
            ...(fecha ? { fecha: new Date(fecha) } : {})
        });

        return res.status(201).json(nuevaCompra);
    }
    catch (error) {
        return manejarError(res, error, 'Error al crear la compra');
    }
};

export const actualizarCompra = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { id } = req.query;
    const { id_proveedor, numero_factura, fecha } = req.body;

    try {
        const compraActualizada = await db.transaction(async (t) => {
            const compra = await obtenerCompraBorrador(Number(id), t);

            if (id_proveedor !== undefined) {
                const proveedor = await Proveedor.findByPk(Number(id_proveedor), { transaction: t });

                if (!proveedor) {
                    throw new ErrorNegocio(404, 'El proveedor indicado no existe');
                }

                if (proveedor.estado !== EstadoProveedor.ACTIVO) {
                    throw new ErrorNegocio(400, 'El proveedor indicado está inactivo');
                }

                compra.id_proveedor = Number(id_proveedor);
            }

            compra.numero_factura = numero_factura ?? compra.numero_factura;
            if (fecha) compra.fecha = new Date(fecha);

            await compra.save({ transaction: t });
            return compra;
        });

        return res.json(compraActualizada);
    }
    catch (error) {
        return manejarError(res, error, 'Error al actualizar la compra');
    }
};

export const eliminarCompra = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { id } = req.query;

    try {
        await db.transaction(async (t) => {
            const compra = await Compra.findByPk(Number(id), { transaction: t, lock: t.LOCK.UPDATE });

            if (!compra) {
                throw new ErrorNegocio(404, 'No se encontró esa compra');
            }

            if (compra.estado !== EstadoCompra.BORRADOR) {
                throw new ErrorNegocio(409, 'Solo se pueden eliminar compras en borrador');
            }

            await DetalleCompra.destroy({ where: { id_compra: Number(id) }, transaction: t });
            await compra.destroy({ transaction: t });
        });

        return res.json({ message: 'Compra eliminada correctamente' });
    }
    catch (error) {
        return manejarError(res, error, 'Error al eliminar la compra');
    }
};

export const agregarDetalle = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { id } = req.query;
    const { id_producto, cantidad, costo_unitario } = req.body;

    try {
        const resultado = await db.transaction(async (t) => {
            await obtenerCompraBorrador(Number(id), t);

            const producto = await db.query(
                'SELECT id_producto FROM productos WHERE id_producto = :id_producto',
                { replacements: { id_producto: Number(id_producto) }, type: QueryTypes.SELECT, transaction: t }
            );

            if (producto.length === 0) {
                throw new ErrorNegocio(404, 'El producto indicado no existe');
            }

            const subtotalDetalle = Number(cantidad) * Number(costo_unitario);

            const detalle = await DetalleCompra.create({
                id_compra: Number(id),
                id_producto: Number(id_producto),
                cantidad: Number(cantidad),
                costo_unitario: Number(costo_unitario).toFixed(2),
                subtotal: subtotalDetalle.toFixed(2)
            }, { transaction: t });

            await recalcularTotales(Number(id), t);

            const compra = await Compra.findByPk(Number(id), { transaction: t });
            return { detalle, compra };
        });

        return res.status(201).json(resultado);
    }
    catch (error) {
        return manejarError(res, error, 'Error al agregar el detalle de la compra');
    }
};

export const eliminarDetalle = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { id, id_detalle } = req.query;

    try {
        const compra = await db.transaction(async (t) => {
            await obtenerCompraBorrador(Number(id), t);

            const eliminados = await DetalleCompra.destroy({
                where: { id_detalle_compra: Number(id_detalle), id_compra: Number(id) },
                transaction: t
            });

            if (eliminados === 0) {
                throw new ErrorNegocio(404, 'No se encontró ese detalle en la compra indicada');
            }

            await recalcularTotales(Number(id), t);
            return Compra.findByPk(Number(id), { transaction: t });
        });

        return res.json({ message: 'Detalle eliminado correctamente', compra });
    }
    catch (error) {
        return manejarError(res, error, 'Error al eliminar el detalle de la compra');
    }
};

// Confirmar la compra: pasa a "Confirmada" y suma las cantidades al stock de los productos
export const confirmarCompra = async (req: Request, res: Response): Promise<Response> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { id } = req.query;

    try {
        const compraConfirmada = await db.transaction(async (t) => {
            const compra = await Compra.findByPk(Number(id), { transaction: t, lock: t.LOCK.UPDATE });

            if (!compra) {
                throw new ErrorNegocio(404, 'No se encontró esa compra');
            }

            if (compra.estado !== EstadoCompra.BORRADOR) {
                throw new ErrorNegocio(409, 'La compra ya fue procesada');
            }

            const detalles = await DetalleCompra.findAll({
                where: { id_compra: Number(id) },
                transaction: t
            });

            if (detalles.length === 0) {
                throw new ErrorNegocio(400, 'Debe agregar al menos un producto antes de confirmar');
            }

            for (const detalle of detalles) {
                await db.query(
                    `UPDATE productos
                     SET stock = stock + :cantidad, estado = 1
                     WHERE id_producto = :id_producto`,
                    {
                        replacements: { cantidad: detalle.cantidad, id_producto: detalle.id_producto },
                        type: QueryTypes.UPDATE,
                        transaction: t
                    }
                );
            }

            compra.estado = EstadoCompra.CONFIRMADA;
            await compra.save({ transaction: t });

            return compra;
        });

        let correoEnviado = true;

        try{
            await correoCompra(Number(id));
        }
        catch(errorCorreo){
            correoEnviado = false;
            console.error('Compra confirmada pero falló el envío del correo', errorCorreo);
        }

        return res.json({ message: correoEnviado
            ? 'Compra confirmada, inventario actualizado y correo enviado al proveedor'
            : 'Compra confirmada e inventario actualizado, pero no se pudo enviar el correo',
            correo_enviado: correoEnviado,
            compra: compraConfirmada
        });
    }
    catch (error) {
        return manejarError(res, error, 'Error al confirmar la compra');
    }
};
