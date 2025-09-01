import { Router } from "express";
import {
  cancelOrder,
  createNewOrder,
  getAllOrders,
  getSingleOrder,
  updateOrder,
  updateOrderStatus,
} from "../controllers/Order.controllers";
import {
  initiatePayment,
  verifyPayment,
} from "../controllers/order.payments.controllers";
import { appAuth, isWorker } from "../middlewares/auth";
import { validateOrder } from "../middlewares/order";
import { removeSensitiveFields } from "../utils/util";

const router = Router();

router.get("/", appAuth, getAllOrders);
router.post("/", appAuth,  removeSensitiveFields, createNewOrder);
router.get("/:id", appAuth, validateOrder, getSingleOrder);
router.put(
  "/:id",
  appAuth,
  // isWorker,
  removeSensitiveFields,
  validateOrder,
  updateOrder
);
router.patch(
  "/:id/status",
  appAuth,
  // isWorker,
  removeSensitiveFields,
  validateOrder,
  updateOrderStatus
);
router.patch(
  "/:id",
  appAuth,
  // isWorker,
  removeSensitiveFields,
  validateOrder,
  updateOrder
);

router.put(
  "/:id/cancel-order",
  appAuth,
  // isWorker,
  removeSensitiveFields,
  validateOrder,
  cancelOrder
);
router.patch(
  "/:id/cancel-order",
  appAuth,
  // isWorker,
  removeSensitiveFields,
  validateOrder,
  cancelOrder
);

// Initiate payment
router.put(
  "/:id/initiate-payment",
  appAuth,
  // isWorker,
  removeSensitiveFields,
  validateOrder,
  initiatePayment
);

// Initiate payment
router.put(
  "/:id/verify-payment",
  appAuth,
  // isWorker,
  removeSensitiveFields,
  validateOrder,
  verifyPayment
);
// Initiate payment
export default router;
