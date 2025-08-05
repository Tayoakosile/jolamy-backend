import { Router } from "express";

import {
  addToCart,
  getSingleProductForNotAdmin,
} from "../controllers/product.controllers";
import { appAuth } from "../middlewares/auth";

const router = Router();

router.post("/:id/cart", appAuth, addToCart);
router.get("/products/:id", appAuth, getSingleProductForNotAdmin);
export default router;
