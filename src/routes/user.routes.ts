import { Router } from "express";
import { createAccount } from "../controllers/auth.controllers";
import { appAuth } from "../middlewares/auth";
import { getAllUsers, getSingleUser } from "../controllers/general/Users/users.controllers";
// import { createUser, getUsers } from '../controllers/user.controllers';

const router = Router();

// router.get("/", getUsers);
router.post("/", createAccount);

// Routes for user management
router.get("/", appAuth, getAllUsers);
router.get("/:id", appAuth, getSingleUser);

export default router;
