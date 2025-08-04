"use strict";
// routes/admin.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const admin_controller_1 = require("../controllers/Admin/admin.controller");
const admin_offices_controller_1 = require("../controllers/Admin/admin.offices.controller");
const router = (0, express_1.Router)();
// users
router.get("/pending-users", auth_1.appAuth, auth_1.isAdmin, admin_controller_1.getPendingUsers);
router.post("/approve/:userId", auth_1.appAuth, auth_1.isAdmin, admin_controller_1.approveUser);
router.post("/reject/:userId", auth_1.appAuth, auth_1.isAdmin, admin_controller_1.rejectUser);
// users
// offices
router.get("/offices", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.getOffices);
router.post("/offices", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.createNewOffices);
router.get("/offices/:id", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.getSingleOffice);
router.put("/offices/:id", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.updateOffice);
router.patch("/offices/:id", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.updateOffice);
// offices
exports.default = router;
