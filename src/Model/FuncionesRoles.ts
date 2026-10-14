import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from "sequelize";
import db from "../Configs/db.js";

export class FuncionesRoles extends Model<
    InferAttributes<FuncionesRoles>,
    InferCreationAttributes<FuncionesRoles>
> {
    declare rolescod: string;
    declare fncod: string;
    declare fnrolest: CreationOptional<string | null>;
    declare fnexp: CreationOptional<Date | null>;
}

FuncionesRoles.init(
    {
        rolescod: {
            type: DataTypes.STRING(15),
            primaryKey: true,
            allowNull: false
        },

        fncod: {
            type: DataTypes.STRING(255),
            primaryKey: true,
            allowNull: false
        },

        fnrolest: {
            type: DataTypes.CHAR(3),
            allowNull: true,
            defaultValue: null
        },

        fnexp: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        }
    },
    {
        sequelize: db,
        tableName: "funciones_roles",
        timestamps: false
    }
);

export default FuncionesRoles;