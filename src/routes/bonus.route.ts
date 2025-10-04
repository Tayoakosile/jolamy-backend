import { Router } from "express";
import { getBonuses, getSingleBonus } from "../controllers/bonus.controllers";
import { appAuth } from "../middlewares/auth";

const router = Router();
router.get("/", appAuth, getBonuses);
router.get("/:id", appAuth, getSingleBonus);

export default router;
