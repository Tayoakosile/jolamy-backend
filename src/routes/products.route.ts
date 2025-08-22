import { Router } from "express";

import {
  addToCart,
  getSingleProductForNotAdmin,
} from "../controllers/product.controllers";
import { appAuth } from "../middlewares/auth";
import { getProducts } from "../controllers/Admin/admin.products.controller";

const router = Router();

router.post("/:id/cart", appAuth, addToCart);
router.get("/cart", appAuth, addToCart);
router.get("/", appAuth, getProducts);
router.get("/:id", appAuth, getSingleProductForNotAdmin);
export default router;