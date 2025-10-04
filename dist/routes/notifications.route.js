"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_controllers_1 = require("../controllers/notifications.controllers");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get("/", auth_1.appAuth, notifications_controllers_1.getNotifications);
router.patch("/:id/read", auth_1.appAuth, notifications_controllers_1.updateNotificationReadStatus);
exports.default = router;
