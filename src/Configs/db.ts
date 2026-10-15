import 'dotenv/config';
import { Sequelize } from "sequelize";

const db = new Sequelize(
    process.env.NOMBRE_DB || '',
    process.env.USUARIO_DB || '',
    process.env.CONTRASENA_DB || '',
    {
        host: process.env.HOST_DB || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        dialect: "mysql",
        logging: false
    }
);

export default db;