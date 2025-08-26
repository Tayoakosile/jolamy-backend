// routes/admin.routes.ts

import { Router } from "express";
import { appAuth } from "../middlewares/auth";
import { getSingleOffice } from "../controllers/Admin/admin.offices.controller";

const router = Router();

router.get("/:id", appAuth, getSingleOffice);

export default router;
// router.get("/offices/:id", appAuth,  getSingleOffice);
