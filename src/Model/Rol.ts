import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes
} from "sequelize";

import db from "../Configs/db.js";

export class Rol extends Model<
    InferAttributes<Rol>,
    InferCreationAttributes<Rol>
> {
    declare rolescod: string;
    declare rolesdsc: string;
    declare rolesest: string;
}

Rol.init(
    {
        rolescod: {
            type: DataTypes.STRING(15),
            primaryKey: true,
            allowNull: false
        },
        rolesdsc: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        rolesest: {
            type: DataTypes.CHAR(3),
            allowNull: true,
            defaultValue: "ACT"
        }
    },
    {
        sequelize: db,
        tableName: "roles",
        timestamps: false
    }
);

export default Rol;