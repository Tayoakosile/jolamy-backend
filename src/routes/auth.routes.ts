import { Router } from "express";
import { createAccount, loginAccount } from "../controllers/auth.controllers";

const router = Router();

router.post("/signup", createAccount);
router.post("/login", loginAccount);

export default router;
