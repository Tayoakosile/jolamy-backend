import { Router } from "express";
import { createAccount } from "../controllers/auth.controllers";
import { appAuth } from "../middlewares/auth";
// import { createUser, getUsers } from '../controllers/user.controllers';

const router = Router();

// router.get("/", getUsers);
router.post("/", createAccount);

// Routes for user management
router.get("/", appAuth, getAllUsers);
router.get("/:id", appAuth, ()=>{});

export default router;
