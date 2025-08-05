// routes/admin.routes.ts

import { Router } from "express";
import { appAuth, isAdmin } from "../../middlewares/auth";
import {
  getPendingUsers,
  approveUser,
  rejectUser,
} from "../../controllers/Admin/admin.controller";

const router = Router();
// users
router.get("/pending-users", appAuth, isAdmin, getPendingUsers);
router.post("/approve/:user_id", appAuth, isAdmin, approveUser);
router.post("/reject/:user_id", appAuth, isAdmin, rejectUser);
// users

export default router;
