
import { Router } from "express";

import { getBanks, verifyBankAccount } from "../controllers/banks.controllers";
import { appAuth } from "../middlewares/auth";

const router = Router();

router.get("/",  getBanks);
router.get("/resolve",  verifyBankAccount);


export default router;
