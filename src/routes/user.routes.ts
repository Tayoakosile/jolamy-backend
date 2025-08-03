import { Router } from "express";
import { createAccount } from "../controllers/auth.controllers";
// import { createUser, getUsers } from '../controllers/user.controllers';

const router = Router();

// router.get("/", getUsers);
router.post("/", createAccount);

export default router;
