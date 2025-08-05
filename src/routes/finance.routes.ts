import { Router } from "express";
import {
  createNewFinance,
  getAllFinance,
  updateFinance,
} from "../controllers/finance.controllers";
import { appAuth, isWorker } from "../middlewares/auth";

const router = Router();

router.get("/", appAuth, isWorker, getAllFinance);
router.post("/", appAuth, isWorker, createNewFinance);
// edit cash flow
router.put("/:id", appAuth, isWorker, updateFinance);
router.patch("/:id", appAuth, isWorker, updateFinance);

export default router;
