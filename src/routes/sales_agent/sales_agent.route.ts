import { Router } from "express";
import {
  getAllDistributors,
  getSingleDistributorDetails,
  startOrderCollectionProcess,
  verifyOrderCollectionOtp,
} from "../../controllers/Sales_agent/sales_agent.controllers";
import { appAuth } from "../../middlewares/auth";
import { validateOrder } from "../../middlewares/order";
import { removeSensitiveFields } from "../../utils/util";

const router = Router();

router.get("/", appAuth, getAllDistributors);
router.get("/:id", appAuth, getSingleDistributorDetails);
router.post(
  "/:id/start-order-collection",
  appAuth,
  removeSensitiveFields,
  validateOrder,
  startOrderCollectionProcess
);
router.post(
  "/:id/start-order-collection/verify-otp",
  appAuth,
  removeSensitiveFields,
  validateOrder,
  verifyOrderCollectionOtp
);

// router.get("/orders/:id/status", appAuth, getSingleSalesAgentOrder);

export default router;
