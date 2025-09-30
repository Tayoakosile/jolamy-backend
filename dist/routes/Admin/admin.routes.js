"use strict";
// routes/admin.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../../controllers/Admin/admin.controller");
const admin_finance_controller_1 = require("../../controllers/Admin/admin.finance.controller");
const admin_offices_controller_1 = require("../../controllers/Admin/admin.offices.controller");
const admin_offices_worker_controller_1 = require("../../controllers/Admin/admin.offices.worker.controller");
const admin_products_controller_1 = require("../../controllers/Admin/admin.products.controller");
const admin_inventory_controller_1 = require("../../controllers/Admin/admin.inventory.controller");
const auth_1 = require("../../middlewares/auth");
const util_1 = require("../../utils/util");
const users_controllers_1 = require("../../controllers/general/Users/users.controllers");
const bonus_controllers_1 = require("../../controllers/bonus.controllers");
const router = (0, express_1.Router)();
// users
router.post("/approve/:user_id", auth_1.appAuth, auth_1.isAdmin, admin_controller_1.approveUser);
router.post("/reject/:user_id", auth_1.appAuth, auth_1.isAdmin, admin_controller_1.rejectUser);
// users
// offices
router.post("/offices", auth_1.appAuth, auth_1.isAdmin, util_1.removeSensitiveFields, admin_offices_controller_1.createNewOffices);
router.get("/offices", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.getOffices);
router.get("/offices/:id", auth_1.appAuth, admin_offices_controller_1.getSingleOffice);
router.put("/offices/:id", auth_1.appAuth, auth_1.isAdmin, util_1.removeSensitiveFields, admin_offices_controller_1.updateOffice);
router.patch("/offices/:id", auth_1.appAuth, auth_1.isAdmin, admin_offices_controller_1.updateOffice);
router.put("/offices/:id/fund-wallet", auth_1.appAuth, auth_1.isAdmin, util_1.removeSensitiveFields, admin_finance_controller_1.adminFundWallet);
router.post("/offices/:id/add-worker", auth_1.appAuth, auth_1.isAdmin, util_1.removeSensitiveFields, admin_offices_worker_controller_1.addOfficeWorker);
router.post("/offices/add-worker", auth_1.appAuth, auth_1.isAdmin, util_1.removeSensitiveFields, admin_offices_worker_controller_1.addOfficeWorker);
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
router.put("/products/:id/options", auth_1.appAuth, auth_1.isAdmin, admin_products_controller_1.updateProductOptions);
router.patch("/products/:id/options", auth_1.appAuth, auth_1.isAdmin, admin_products_controller_1.updateProductOptions);
// router.patch("/products/:id/options", appAuth, isAdmin, patchProductOptions);
// router.patch("/products/:id/options", appAuth, isAdmin, patchProductOptions);
router.patch("/products/:id", auth_1.appAuth, auth_1.isAdmin, admin_products_controller_1.updateProduct);
router.patch("/products/:id/archive", auth_1.appAuth, auth_1.isAdmin, admin_products_controller_1.archiveProduct);
// users
// stats
// users
router.get("/pending-users", auth_1.appAuth, auth_1.isAdmin, users_controllers_1.getPendingUsers);
router.get("/inventory", auth_1.appAuth, auth_1.isAdmin, admin_inventory_controller_1.getAllInventory);
router.get("/bonus", auth_1.appAuth, auth_1.isAdmin, bonus_controllers_1.runBonusPayment);
// users
exports.default = router;
