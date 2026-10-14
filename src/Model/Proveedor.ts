import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from "sequelize";
import db from "../Configs/db.js";

export enum EstadoProveedor {
    ACTIVO = 'Activo',
    INACTIVO = 'Inactivo'
}

export class Proveedor extends Model<InferAttributes<Proveedor>,
    InferCreationAttributes<Proveedor>> {
    declare id_proveedor: CreationOptional<number>;
    declare nombre: string;
    declare contacto: CreationOptional<string | null>;
    declare telefono: CreationOptional<string | null>;
    declare correo: CreationOptional<string | null>;
    declare direccion: CreationOptional<string | null>;
    declare estado: CreationOptional<EstadoProveedor>;
}

Proveedor.init(
    {
        id_proveedor: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        nombre: {
            type: DataTypes.STRING(120),
            allowNull: false
        },

        contacto: {
            type: DataTypes.STRING(120),
            allowNull: true
        },

        telefono: {
            type: DataTypes.STRING(20),
            allowNull: true
        },

        correo: {
            type: DataTypes.STRING(120),
            allowNull: true
        },

        direccion: {
            type: DataTypes.STRING(255),
            allowNull: true
        },

        estado: {
            type: DataTypes.ENUM(...Object.values(EstadoProveedor)),
            allowNull: false,
            defaultValue: EstadoProveedor.ACTIVO
        }
    },

    {
        sequelize: db,
        tableName: 'proveedores',
        timestamps: false
    }
);

export default Proveedor;
