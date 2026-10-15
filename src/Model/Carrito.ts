import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from "sequelize";
import db from "../Configs/db.js";

export class Carrito extends Model<
    InferAttributes<Carrito>,
    InferCreationAttributes<Carrito>
> {
    declare id_carrito: CreationOptional<number>;
    declare usercod: number;
    declare estado: CreationOptional<"Activo" | "Finalizado">;
}

Carrito.init(
    {
        id_carrito: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        usercod: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        estado: {
            type: DataTypes.ENUM("Activo", "Finalizado"),
            allowNull: false,
            defaultValue: "Activo"
        }
    },
    {
        sequelize: db,
        tableName: "carritos",
        timestamps: false
    }
);

export default Carrito;