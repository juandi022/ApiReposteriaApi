import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from "sequelize";
import db from "../Configs/db.js";

/**
 * Registra los intentos fallidos de inicio de sesión por usuario/identificador
 * para poder bloquear temporalmente la cuenta.
 */
export class IntentoLogin extends Model<InferAttributes<IntentoLogin>,
    InferCreationAttributes<IntentoLogin>> {
    declare id: CreationOptional<number>;
    declare clave: string;
    declare intentos: CreationOptional<number>;
    declare bloqueadoHasta: Date | null;
}

IntentoLogin.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        clave: {
            type: DataTypes.STRING(180),
            allowNull: false,
            unique: true
        },

        intentos: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },

        bloqueadoHasta: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },

    {
        sequelize: db,
        tableName: 'intentos_login',
        timestamps: false
    }
);

export default IntentoLogin;
