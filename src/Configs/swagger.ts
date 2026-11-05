import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Express } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Repostería - Catálogo de productos',
            version: '1.0.0',
            description: 'Documentación de la API de catálogo y envío de imágenes de productos'
        },
        servers: [
            { url: `http://localhost:${process.env.PORT || 3001}` }
        ],
        components: {
            schemas: {
                Producto: {
                    type: 'object',
                    properties: {
                        id_producto: { type: 'integer', example: 1 },
                        nombre: { type: 'string', example: 'Pastel de chocolate' },
                        descripcion: { type: 'string', nullable: true, example: 'Pastel de 8 porciones' },
                        precio: { type: 'string', example: '350.00' },
                        stock: { type: 'integer', example: 10 },
                        imagen: { type: 'string', nullable: true, example: '1730000000000-123456789.png' },
                        estado: { type: 'boolean', example: true }
                    }
                }
            }
        }
    },
    // Swagger lee los comentarios @swagger de todos los archivos de rutas
    apis: [path.join(__dirname, '../Routes/**/*.ts').replace(/\\/g, '/')]
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
