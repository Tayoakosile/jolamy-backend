import { Router } from "express";

import { deleteCart, getCarts } from "../controllers/cart.controllers";
import { addToCart } from "../controllers/product.controllers";
import { appAuth } from "../middlewares/auth";

const router = Router();

router.post("/", appAuth, addToCart);
router.get("/", appAuth, getCarts);
// router.put("/:id", appAuth, updateCart);
router.delete("/:id", appAuth, deleteCart);

export default router;
