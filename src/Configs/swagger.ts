import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Obtener la ruta actual del archivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Swagger
const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',

        info: {
            title: 'TechMarket API',
            version: '1.0.0',
            description: 'Documentación de la API del proyecto TechMarket'
        },

        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Servidor local'
            }
        ],

        tags: [
            {
                name: 'Funciones',
                description: 'Gestión de funciones del sistema'
            },
            {
                name: 'Roles',
                description: 'Gestión de roles del sistema'
            }
        ],

        components: {
            schemas: {
                Funcion: {
                    type: 'object',
                    properties: {
                        fncod: {
                            type: 'string',
                            example: 'PRODUCTOS'
                        },
                        fndsc: {
                            type: 'string',
                            example: 'Administración de productos'
                        },
                        fnest: {
                            type: 'string',
                            enum: ['ACT', 'INA'],
                            example: 'ACT'
                        },
                        fntyp: {
                            type: 'string',
                            example: 'MNT'
                        }
                    }
                },

                Rol: {
                    type: 'object',
                    properties: {
                        rolescod: {
                            type: 'string',
                            example: 'ADMIN'
                        },
                        rolesdsc: {
                            type: 'string',
                            example: 'Administrador del sistema'
                        },
                        rolesest: {
                            type: 'string',
                            enum: ['ACT', 'INA'],
                            example: 'ACT'
                        }
                    }
                }
            }
        }
    },

    apis: [
        path.join(__dirname, '../Routes/**/*.js'),
        path.join(__dirname, '../Routes/**/*.ts')
    ]
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
