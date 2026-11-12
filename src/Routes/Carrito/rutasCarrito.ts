import { Router } from "express";

import {
    verCarrito,
    agregarAlCarrito,
    quitarDelCarrito,
    eliminarDelCarrito
} from "../../Controllers/Carrito/Carrito.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Carrito
 *   description: Gestión del carrito de compras
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Carrito:
 *       type: object
 *       properties:
 *         id_carrito:
 *           type: integer
 *           example: 1
 *         usercod:
 *           type: integer
 *           example: 1
 *         estado:
 *           type: string
 *           enum: [Activo, Finalizado]
 *           example: Activo
 *     DetalleCarrito:
 *       type: object
 *       properties:
 *         id_detalle_carrito:
 *           type: integer
 *           example: 1
 *         id_carrito:
 *           type: integer
 *           example: 1
 *         id_producto:
 *           type: integer
 *           example: 3
 *         cantidad:
 *           type: integer
 *           example: 2
 *         precio_unitario:
 *           type: string
 *           example: '25.00'
 */

/**
 * @swagger
 * /api/carrito/{usercod}:
 *   get:
 *     summary: Ver el carrito activo de un usuario
 *     description: Si el usuario no tiene carrito activo, se crea automáticamente.
 *     tags: [Carrito]
 *     parameters:
 *       - in: path
 *         name: usercod
 *         required: true
 *         description: Código del usuario
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Carrito con sus productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 carrito:
 *                   $ref: '#/components/schemas/Carrito'
 *                 productos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       detalle:
 *                         $ref: '#/components/schemas/DetalleCarrito'
 *                       producto:
 *                         $ref: '#/components/schemas/Producto'
 *       500:
 *         description: Error al obtener el carrito
 */
router.get("/:usercod", verCarrito);

/**
 * @swagger
 * /api/carrito:
 *   post:
 *     summary: Agregar un producto al carrito
 *     description: Si el producto ya existe en el carrito, se suma la cantidad indicada.
 *     tags: [Carrito]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usercod, id_producto]
 *             properties:
 *               usercod:
 *                 type: integer
 *                 example: 1
 *               id_producto:
 *                 type: integer
 *                 example: 3
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 example: 2
 *     responses:
 *       201:
 *         description: Producto agregado al carrito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 detalle:
 *                   $ref: '#/components/schemas/DetalleCarrito'
 *       200:
 *         description: Cantidad actualizada porque el producto ya estaba en el carrito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 detalle:
 *                   $ref: '#/components/schemas/DetalleCarrito'
 *       400:
 *         description: La cantidad es inválida o no hay suficiente stock
 *       404:
 *         description: Producto no encontrado o inactivo
 *       500:
 *         description: Error al agregar el producto
 */
router.post("/", agregarAlCarrito);

/**
 * @swagger
 * /api/carrito/quitar/{id}:
 *   put:
 *     summary: Quitar una unidad de un producto del carrito
 *     description: Si la cantidad es mayor a 1 se reduce en uno; si es 1 se elimina el detalle.
 *     tags: [Carrito]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del detalle del carrito
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Cantidad reducida o producto eliminado del carrito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 detalle:
 *                   $ref: '#/components/schemas/DetalleCarrito'
 *       404:
 *         description: Producto no encontrado en el carrito
 *       500:
 *         description: Error al quitar el producto
 */
router.put("/quitar/:id", quitarDelCarrito);

/**
 * @swagger
 * /api/carrito/{id}:
 *   delete:
 *     summary: Eliminar un producto del carrito
 *     description: Elimina el detalle completo del carrito.
 *     tags: [Carrito]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del detalle del carrito
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Producto eliminado del carrito
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error al eliminar el producto
 */
router.delete("/:id", eliminarDelCarrito);

export default router;
