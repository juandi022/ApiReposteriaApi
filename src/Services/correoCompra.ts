import { QueryTypes } from "sequelize";
import db from "../Configs/db.js";
import Compra from "../Model/Compra.js";
import Proveedor from "../Model/Proveedor.js";
import { enviarCorreo } from "../Configs/correo.js";

interface DetalleCorreo {
    producto: string,
    cantidad: number
}

export const correoCompra = async (idCompra: number): Promise<void> => {
    const compra = await Compra.findByPk(idCompra);
    if (!compra) throw new Error('Compra no encontrada para enviar el correo');

    const proveedor = await Proveedor.findByPk(compra.id_proveedor);
    if (!proveedor) throw new Error('Proveedor no encontrado');

    const destinatario = proveedor.correo as string;
    if (!destinatario) throw new Error('El proveedor no tiene correo asociado');

    const detalles = await db.query<DetalleCorreo>(
        `SELECT p.nombre AS producto, d.cantidad
            FROM detalle_compra d
            INNER JOIN productos p ON d.id_producto = p.id_producto
            WHERE d.id_compra = :id_compra
            ORDER BY d.id_detalle_compra ASC`,
        { replacements: { id_compra: idCompra }, type: QueryTypes.SELECT }
    );

    const lineas = detalles
        .map(d => `- ${d.producto}: ${d.cantidad} unidades`)
        .join('\n');

    const mensaje = `Estimados ${proveedor.nombre},
        Nos hemos quedado sin existencias de algunos productos y necesitamos reabastecernos.
        Quisiéramos solicitarles lo siguiente:
        ${lineas}
        Quedamos atentos a su respuesta.
        
        Saludos Cordiales.`;

    await enviarCorreo(destinatario, `Solicitud de compra #${compra.id_compra}`, mensaje);

};