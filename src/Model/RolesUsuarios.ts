import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from "sequelize";
import db from "../Configs/db.js";

export class RolesUsuarios extends Model<
    InferAttributes<RolesUsuarios>,
    InferCreationAttributes<RolesUsuarios>
> {
    declare usercod: number;
    declare rolescod: string;
    declare roleuserest: CreationOptional<string | null>;
    declare roleuserfch: CreationOptional<Date | null>;
    declare roleuserexp: CreationOptional<Date | null>;
}

RolesUsuarios.init(
    {
        usercod: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false
        },

        rolescod: {
            type: DataTypes.STRING(15),
            primaryKey: true,
            allowNull: false
        },

        roleuserest: {
            type: DataTypes.CHAR(3),
            allowNull: true,
            defaultValue: null
        },

        roleuserfch: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },

        roleuserexp: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        }
    },
    {
        sequelize: db,
        tableName: "roles_usuarios",
        timestamps: false
    }
);

export default RolesUsuarios;