import { Router } from "express";

import {
  getSingleProductForNotAdmin,
} from "../controllers/product.controllers";
import { appAuth } from "../middlewares/auth";
import { getProducts } from "../controllers/Admin/admin.products.controller";

const router = Router();


router.get("/", appAuth, getProducts);
router.get("/:id", appAuth, getSingleProductForNotAdmin);
export default router;