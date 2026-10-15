import { Router } from "express";

import {
    verCarrito,
    agregarAlCarrito,
    quitarDelCarrito,
    eliminarDelCarrito
} from "../../Controllers/Carrito/Carrito.js";

const router = Router();

router.get("/:usercod", verCarrito);
router.post("/", agregarAlCarrito);
router.put("/quitar/:id", quitarDelCarrito);
router.delete("/:id", eliminarDelCarrito);

export default router;