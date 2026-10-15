import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from "sequelize";
import db from "../Configs/db.js";

export class DetalleCarrito extends Model<
    InferAttributes<DetalleCarrito>,
    InferCreationAttributes<DetalleCarrito>
> {
    declare id_detalle_carrito: CreationOptional<number>;
    declare id_carrito: number;
    declare id_producto: number;
    declare cantidad: number;
    declare precio_unitario: string;
}

DetalleCarrito.init(
    {
        id_detalle_carrito: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_carrito: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_producto: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        precio_unitario: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        }
    },
    {
        sequelize: db,
        tableName: "detalle_carrito",
        timestamps: false
    }
);

export default DetalleCarrito;