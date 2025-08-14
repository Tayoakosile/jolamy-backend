"use strict";
// routes/admin.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../../controllers/Admin/admin.controller");
const admin_finance_controller_1 = require("../../controllers/Admin/admin.finance.controller");
const admin_offices_controller_1 = require("../../controllers/Admin/admin.offices.controller");
const admin_offices_worker_controller_1 = require("../../controllers/Admin/admin.offices.worker.controller");
const admin_products_controller_1 = require("../../controllers/Admin/admin.products.controller");
const admin_stats_controller_1 = require("../../controllers/Admin/admin.stats.controller");
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
// users
router.post("/approve/:user_id", auth_1.appAuth, auth_1.isAdmin, admin_controller_1.approveUser);
router.post("/reject/:user_id", auth_1.appAuth, auth_1.isAdmin, admin_controller_1.rejectUser);
// users
// offices
router.post("/offices", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.createNewOffices);
router.get("/offices", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.getOffices);
router.get("/offices/:id", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.getSingleOffice);
router.put("/offices/:id", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.updateOffice);
router.patch("/offices/:id", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.updateOffice);
router.post("/offices/:id/add-worker", auth_1.appAuth, auth_1.isAdmin, admin_offices_worker_controller_1.addOfficeWorker);
router.put("/offices/:id/workers/:worker_id/edit-worker", auth_1.appAuth, auth_1.isAdmin, admin_offices_worker_controller_1.updateWorkerDetails);
router.patch("/offices/:id/workers/:worker_id/edit-worker", auth_1.appAuth, auth_1.isAdmin, admin_offices_worker_controller_1.updateWorkerDetails);
// offices
// finance
router.get("/finances", auth_1.appAuth, auth_1.isAdmin, admin_finance_controller_1.getAllCashFlow);
router.get("/finances/:id", auth_1.appAuth, auth_1.isAdmin, admin_finance_controller_1.getSingleCashFlow);
// finance
// products
// users
router.get("/products", auth_1.appAuth, auth_1.isAdmin, admin_products_controller_1.getProducts);
router.post("/products", auth_1.appAuth, auth_1.isAdmin, 
// upload.array("files"),
admin_products_controller_1.addNewProducts);
router.get("/products/:id", auth_1.appAuth, auth_1.isAdmin, admin_products_controller_1.getSingleProducts);
router.put("/products/:id", auth_1.appAuth, auth_1.isAdmin, admin_products_controller_1.updateProduct);
router.patch("/products/:id", auth_1.appAuth, auth_1.isAdmin, admin_products_controller_1.updateProduct);
router.patch("/products/:id/archive", auth_1.appAuth, auth_1.isAdmin, admin_products_controller_1.archiveProduct);
// users
// stats
router.get("/stats", auth_1.appAuth, auth_1.isAdmin, admin_stats_controller_1.getStats);
// users
router.get("/pending-users", auth_1.appAuth, auth_1.isAdmin, admin_controller_1.getPendingUsers);
// users
exports.default = router;
