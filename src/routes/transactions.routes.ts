import { Router } from "express";
import {
    getAllTransactions,
    getSingleTransaction,
    updateTransaction,
} from "../controllers/Transactions.controller";
import { appAuth } from "../middlewares/auth";

const router = Router();

router.get("/", appAuth, getAllTransactions);
router.get("/:id", appAuth, getSingleTransaction);
router.put("/:id", appAuth, updateTransaction);
router.patch("/:id", appAuth, updateTransaction);

export default router;
