import { Router } from "express";
import {
  getAllDistributors,
  getSingleDistributorDetails,
} from "../../controllers/Sales_agent/sales_agent.controllers";
import { appAuth } from "../../middlewares/auth";
import { getSingleOrder } from "../../controllers/Order.controllers";

const router = Router();

router.get("/", appAuth, getAllDistributors);
router.get("/:id", appAuth, getSingleDistributorDetails);
// router.get("/orders/:id/status", appAuth, getSingleSalesAgentOrder);

export default router;
