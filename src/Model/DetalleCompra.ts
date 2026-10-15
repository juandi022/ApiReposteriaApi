import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from "sequelize";
import db from "../Configs/db.js";
import Compra from "./Compra.js";

export class DetalleCompra extends Model<InferAttributes<DetalleCompra>,
    InferCreationAttributes<DetalleCompra>> {
    declare id_detalle_compra: CreationOptional<number>;
    declare id_compra: number;
    declare id_producto: number;
    declare cantidad: number;
    declare costo_unitario: string;
    declare subtotal: string;
}

DetalleCompra.init(
    {
        id_detalle_compra: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        id_compra: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        id_producto: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        costo_unitario: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        },

        subtotal: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        }
    },

    {
        sequelize: db,
        tableName: 'detalle_compra',
        timestamps: false
    }
);

Compra.hasMany(DetalleCompra, { foreignKey: 'id_compra', as: 'detalles', constraints: false });
DetalleCompra.belongsTo(Compra, { foreignKey: 'id_compra', as: 'compra', constraints: false });

export default DetalleCompra;
