import { Router } from "express";

import { getCarts } from "../controllers/cart.controllers";
import {
    addToCart
} from "../controllers/product.controllers";
import { appAuth } from "../middlewares/auth";

const router = Router();

router.post("/", appAuth, addToCart);
router.get("/", appAuth, getCarts);


export default router;
