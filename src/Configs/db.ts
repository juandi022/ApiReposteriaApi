import 'dotenv/config';
import { Sequelize } from "sequelize";

// Mismas variables de entorno que usa el proyecto de compras/proveedores,
// así se puede reutilizar el mismo archivo .env
const {
    DB_PORT,
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
} = process.env;

const db = new Sequelize(
    DB_NAME || '',
    DB_USER || '',
    DB_PASSWORD || '',
    {
        host: DB_HOST || 'localhost',
        port: Number(DB_PORT || 3306),
        dialect: "mysql",
        logging: false
    }
);

export default db;
