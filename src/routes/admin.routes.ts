// routes/admin.routes.ts

import { Router } from "express";
import { appAuth, isAdmin } from "../middlewares/auth";
import {
  getPendingUsers,
  approveUser,
  rejectUser,
} from "../controllers/Admin/admin.controller";
import { createNewOffices, getOffices, getSingleOffice, updateOffice } from "../controllers/Admin/admin.offices.controller";

const router = Router();

// users
router.get("/pending-users", appAuth, isAdmin, getPendingUsers);
router.post("/approve/:userId", appAuth, isAdmin, approveUser);
router.post("/reject/:userId", appAuth, isAdmin, rejectUser);
// users

// offices
router.get("/offices", appAuth, isAdmin, getOffices);
router.post("/offices", appAuth, isAdmin, createNewOffices);
router.get("/offices/:id", appAuth, isAdmin, getSingleOffice);
router.put("/offices/:id", appAuth, isAdmin, updateOffice);
router.patch("/offices/:id", appAuth, isAdmin, updateOffice);

// offices

export default router;
