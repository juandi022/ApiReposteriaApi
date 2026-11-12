import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from "sequelize";
import db from "../Configs/db.js";
import Usuario from "./Usuario.js";

/**
 * PIN temporal enviado por correo para restablecer la contraseña.
 * Tiene una fecha de expiración y solo puede usarse una vez.
 */
export class PinRecuperacion extends Model<InferAttributes<PinRecuperacion>,
    InferCreationAttributes<PinRecuperacion>> {
    declare id: CreationOptional<number>;
    declare usercod: number;
    declare pin: string;
    declare expiraEn: Date;
    declare usado: CreationOptional<boolean>;
}

PinRecuperacion.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        usercod: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Usuario,
                key: 'usercod'
            }
        },

        pin: {
            type: DataTypes.STRING(10),
            allowNull: false
        },

        expiraEn: {
            type: DataTypes.DATE,
            allowNull: false
        },

        usado: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },

    {
        sequelize: db,
        tableName: 'pines_recuperacion',
        timestamps: false
    }
);

Usuario.hasMany(PinRecuperacion, { foreignKey: 'usercod', as: 'pinesRecuperacion' });
PinRecuperacion.belongsTo(Usuario, { foreignKey: 'usercod', as: 'usuario' });

export default PinRecuperacion;
