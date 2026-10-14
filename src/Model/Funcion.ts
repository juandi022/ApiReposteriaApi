import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes
} from "sequelize";

import db from "../Configs/db.js";

export class Funcion extends Model<
    InferAttributes<Funcion>,
    InferCreationAttributes<Funcion>
> {
    declare fncod: string;
    declare fndsc: string;
    declare fnest: string;
    declare fntyp: string;
}

Funcion.init(
    {
        fncod: {
            type: DataTypes.STRING(255),
            primaryKey: true,
            allowNull: false
        },

        fndsc: {
            type: DataTypes.STRING(45),
            allowNull: false
        },

        fnest: {
            type: DataTypes.CHAR(3),
            allowNull: false,
            defaultValue: 'ACT'
        },

        fntyp: {
            type: DataTypes.CHAR(3),
            allowNull: false
        }
    },

    {
        sequelize: db,
        tableName: 'funciones',
        timestamps: false
    }
);

export default Funcion;