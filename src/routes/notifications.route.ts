import { Router } from "express";

import {
    getNotifications,
    updateNotificationReadStatus,
} from "../controllers/notifications.controllers";
import { appAuth } from "../middlewares/auth";

const router = Router();

router.get("/", appAuth, getNotifications);
router.patch("/:id/read", appAuth, updateNotificationReadStatus);
export default router;
