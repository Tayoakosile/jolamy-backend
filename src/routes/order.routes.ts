import { Router } from "express";
import {
  createNewOrder,
  getAllOrders,
  updateOrder,
} from "../controllers/Order.controllers";
import { appAuth, isWorker } from "../middlewares/auth";
import { removeSensitiveFields } from "../utils/util";

const router = Router();

router.get("/", appAuth, isWorker, getAllOrders);
router.post("/", appAuth, isWorker, removeSensitiveFields, createNewOrder);
router.get("/:id", appAuth, isWorker, getAllOrders);
router.put("/:id", appAuth, isWorker, removeSensitiveFields, updateOrder);
router.patch("/:id", appAuth, isWorker, removeSensitiveFields, updateOrder);

// router.post("/", appAuth, isWorker, createNewFinance);
// // edit cash flow
// router.put("/:id", appAuth, isWorker, updateFinance);
// router.patch("/:id", appAuth, isWorker, updateFinance);
// Add to cart API
export default router;
