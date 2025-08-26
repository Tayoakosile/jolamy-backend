"use strict";
// routes/admin.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const admin_offices_controller_1 = require("../controllers/Admin/admin.offices.controller");
const router = (0, express_1.Router)();
router.get("/:id", auth_1.appAuth, admin_offices_controller_1.getSingleOffice);
exports.default = router;
// router.get("/offices/:id", appAuth,  getSingleOffice);
