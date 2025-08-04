import { Router } from "express";
import { getAllFinance } from "../controllers/finace.controllers";
import { appAuth, isWorker } from "../middlewares/auth";
// import { createUser, getUsers } from '../controllers/user.controllers';

const router = Router();

router.get("/", appAuth, isWorker, getAllFinance);

export default router;
