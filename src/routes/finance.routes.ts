import { Router } from "express";
import {
  createNewFinance,
  getAllFinance,
  getSingleFinance,
  updateFinance,
} from "../controllers/finance.controllers";
import { appAuth } from "../middlewares/auth";

const router = Router();

router.get("/", appAuth, getAllFinance);
router.get("/:id", appAuth, getSingleFinance);
router.post("/", appAuth, createNewFinance);
// edit cash flow
router.put("/:id", appAuth, updateFinance);
router.patch("/:id", appAuth, updateFinance);

export default router;
