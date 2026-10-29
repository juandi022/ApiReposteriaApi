import { Router } from "express";
import { body, query } from "express-validator";

import {
    listarProductos,
    obtenerProducto,
    guardarProducto,
    validarImagenProducto,
    actualizarImagenProducto
} from "../../Controllers/Catalogo/Catalogo.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Catalogo
 *   description: Productos del catálogo e imágenes
 */

/**
 * @swagger
 * /api/catalogo:
 *   get:
 *     summary: Listar los productos activos
 *     tags: [Catalogo]
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producto'
 */
router.get("/", listarProductos);

/**
 * @swagger
 * /api/catalogo/guardar:
 *   post:
 *     summary: Crear un producto (sin imagen)
 *     tags: [Catalogo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, precio]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Pastel de chocolate
 *               descripcion:
 *                 type: string
 *                 example: Pastel de 8 porciones
 *               precio:
 *                 type: number
 *                 example: 350
 *               stock:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: Producto creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       400:
 *         description: Datos inválidos
 */
router.post("/guardar",
    body("nombre")
        .notEmpty().withMessage("El nombre es obligatorio")
        .isLength({ max: 150 }).withMessage("El nombre debe tener máximo 150 caracteres"),
    body("descripcion")
        .optional()
        .isLength({ max: 255 }).withMessage("La descripción debe tener máximo 255 caracteres"),
    body("precio")
        .notEmpty().withMessage("El precio es obligatorio")
        .isFloat({ min: 0 }).withMessage("El precio debe ser un número mayor o igual a 0"),
    body("stock")
        .optional()
        .isInt({ min: 0 }).withMessage("El stock debe ser un entero mayor o igual a 0"),
    guardarProducto
);

/**
 * @swagger
 * /api/catalogo/imagen:
 *   put:
 *     summary: Subir o reemplazar la imagen de un producto
 *     tags: [Catalogo]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [imagen]
 *             properties:
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: Archivo JPG o PNG (máx. 5 MB)
 *     responses:
 *       200:
 *         description: Imagen actualizada
 *       400:
 *         description: ID inválido, archivo no permitido o sin archivo
 *       404:
 *         description: Producto no encontrado
 */
router.put("/imagen",
    query("id")
        .notEmpty().withMessage("El ID es obligatorio")
        .isInt().withMessage("El ID debe ser un número entero"),
    validarImagenProducto,
    actualizarImagenProducto
);

/**
 * @swagger
 * /api/catalogo/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     tags: [Catalogo]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       404:
 *         description: Producto no encontrado
 */
router.get("/:id", obtenerProducto);

export default router;
