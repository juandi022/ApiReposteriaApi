import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from "sequelize";
import db from "../Configs/db.js";
import Proveedor from "./Proveedor.js";

export enum EstadoCompra {
    BORRADOR = 'Borrador',
    CONFIRMADA = 'Confirmada',
    ANULADA = 'Anulada'
}

export class Compra extends Model<InferAttributes<Compra>,
    InferCreationAttributes<Compra>> {
    declare id_compra: CreationOptional<number>;
    declare id_proveedor: number;
    declare fecha: CreationOptional<Date>;
    declare numero_factura: string;
    // MySQL devuelve los DECIMAL como string (ej. "150.00"), por eso se tipan como string
    declare subtotal: CreationOptional<string>;
    declare impuesto: CreationOptional<string>;
    declare total: CreationOptional<string>;
    declare estado: CreationOptional<EstadoCompra>;
}

Compra.init(
    {
        id_compra: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        id_proveedor: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        fecha: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },

        numero_factura: {
            type: DataTypes.STRING(50),
            allowNull: false
        },

        subtotal: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0
        },

        impuesto: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0
        },

        total: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0
        },

        estado: {
            type: DataTypes.ENUM(...Object.values(EstadoCompra)),
            allowNull: false,
            defaultValue: EstadoCompra.BORRADOR
        }
    },

    {
        sequelize: db,
        tableName: 'compras',
        timestamps: false
    }
);

// Relación compra -> proveedor (las llaves foráneas ya existen en la BD del script 06_compras.sql)
Compra.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor', constraints: false });
Proveedor.hasMany(Compra, { foreignKey: 'id_proveedor', as: 'compras', constraints: false });

export default Compra;
