"use strict";
// routes/admin.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const admin_controller_1 = require("../controllers/Admin/admin.controller");
const admin_offices_controller_1 = require("../controllers/Admin/admin.offices.controller");
const admin_finance_controller_1 = require("../controllers/Admin/admin.finance.controller");
const admin_offices_worker_controller_1 = require("../controllers/Admin/admin.offices.worker.controller");
const router = (0, express_1.Router)();
// users
router.get("/pending-users", auth_1.appAuth, auth_1.isAdmin, admin_controller_1.getPendingUsers);
router.post("/approve/:userId", auth_1.appAuth, auth_1.isAdmin, admin_controller_1.approveUser);
router.post("/reject/:userId", auth_1.appAuth, auth_1.isAdmin, admin_controller_1.rejectUser);
// users
// offices
router.post("/offices", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.createNewOffices);
router.get("/offices", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.getOffices);
router.get("/offices/:id", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.getSingleOffice);
router.put("/offices/:id", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.updateOffice);
router.patch("/offices/:id", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.updateOffice);
// Add worker
router.post("/offices/:id/add-worker", auth_1.appAuth, auth_1.isAdmin, admin_offices_worker_controller_1.addOfficeWorker);
// Edit workers details
router.put("/offices/:id/workers/:worker_id/edit-worker", auth_1.appAuth, auth_1.isAdmin, admin_offices_worker_controller_1.updateWorkerDetails);
router.patch("/offices/:id/workers/:worker_id/edit-worker", auth_1.appAuth, auth_1.isAdmin, admin_offices_worker_controller_1.updateWorkerDetails);
// offices
// finance
router.get("/finances", auth_1.appAuth, auth_1.isAdmin, admin_finance_controller_1.getAllCashFlow);
router.get("/finances/:id", auth_1.appAuth, auth_1.isAdmin, admin_finance_controller_1.getSingleCashFlow);
// finance
exports.default = router;
