import { Router } from "express";

import {
    listarProductos,
    obtenerProducto
} from "../../Controllers/Catalogo/Catalogo.js";

const router = Router();

router.get("/", listarProductos);
router.get("/:id", obtenerProducto);

export default router;