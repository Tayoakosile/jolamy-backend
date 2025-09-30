import { Router } from "express";
import { appAuth } from "../middlewares/auth";
import { getSingleBonus } from "../controllers/bonus.controllers";

const router = Router();
router.get("/:id", appAuth, getSingleBonus);

export default router;
