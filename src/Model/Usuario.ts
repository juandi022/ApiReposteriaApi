import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from "sequelize";
import db from "../Configs/db.js";

export enum TipoUsuario {
    PUBLICO = 'PLB',
    ADMINISTRADOR = 'ADM',
    AUDITOR = 'AUD'
}

export class Usuario extends Model<InferAttributes<Usuario>,
    InferCreationAttributes<Usuario>> {
    declare usercod: CreationOptional<number>;
    declare useremail: string;
    declare username: string;
    declare userpswd: string;
    declare userfching: CreationOptional<Date>;
    declare userpswdest: CreationOptional<string>;
    declare userpswdexp: CreationOptional<Date>;
    declare userest: CreationOptional<string>;
    declare useractcod: CreationOptional<string>;
    declare userpswdchg: CreationOptional<Date>;
    declare usertipo: CreationOptional<TipoUsuario>;
}

Usuario.init(
    {
        usercod: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        useremail: {
            type: DataTypes.STRING(80),
            allowNull: false,
            unique: true
        },

        username: {
            type: DataTypes.STRING(80),
            allowNull: false,
            unique: true
        },

        userpswd: {
            type: DataTypes.STRING(128),
            allowNull: false,
            unique: true
        },

        userfching: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW()
        },

        userpswdest: {
            type: DataTypes.CHAR(3),
            defaultValue: 'ACT'
        },

        userpswdexp: {
            type: DataTypes.DATEONLY,
        },

        userest: {
            type: DataTypes.CHAR(3),
            defaultValue: 'ACT'
        },

        useractcod: {
            type: DataTypes.STRING(128),
        },

        userpswdchg: {
            type: DataTypes.DATEONLY,
        },

        usertipo: {
            type: DataTypes.ENUM(...Object.values(TipoUsuario)),
        }
    },

    {
        sequelize: db,
        tableName: 'usuarios',
        timestamps: false
    }
);

export default Usuario;