import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from "sequelize";
import db from "../Configs/db.js";

export class Producto extends Model<
    InferAttributes<Producto>,
    InferCreationAttributes<Producto>
> {
    declare id_producto: CreationOptional<number>;
    declare nombre: string;
    declare descripcion: string | null;
    declare precio: string;
    declare stock: number;
    declare imagen: string | null;
    declare estado: CreationOptional<boolean>;
}

Producto.init(
    {
        id_producto: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        descripcion: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        precio: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        imagen: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        estado: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    },
    {
        sequelize: db,
        tableName: "productos",
        timestamps: false
    }
);

export default Producto;