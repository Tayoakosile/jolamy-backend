import { Router } from "express";

import { addToCart, deleteCart, getCarts } from "../controllers/cart.controllers";

import { appAuth } from "../middlewares/auth";

const router = Router();

router.post("/", appAuth, addToCart);
router.get("/", appAuth, getCarts);
// router.put("/:id", appAuth, updateCart);
router.delete("/:id", appAuth, deleteCart);

export default router;
