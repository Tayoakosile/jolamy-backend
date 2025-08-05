import { Router } from "express";
import {
    createNewFinance,
    updateFinance
} from "../controllers/finance.controllers";
import { getAllOrders } from "../controllers/Order.controllers";
import { appAuth, isWorker } from "../middlewares/auth";

const router = Router();

router.get("/", appAuth, isWorker, getAllOrders);
router.post("/", appAuth, isWorker, createNewFinance);
// edit cash flow
router.put("/:id", appAuth, isWorker, updateFinance);
router.patch("/:id", appAuth, isWorker, updateFinance);

export default router;
