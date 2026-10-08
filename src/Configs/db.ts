export const {
    DB_PORT,
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
} = process.env; 

import { Sequelize } from "sequelize";

const db = new Sequelize(
    DB_NAME || '',
    DB_USER || '',
    DB_PASSWORD || '',
    {
        host: DB_HOST,
        port: Number(DB_PORT || 3306),
        dialect: "mysql",
        logging: false
    }
);

export default db;
