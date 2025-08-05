"use strict";
// routes/admin.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_products_controller_1 = require("../../controllers/Admin/admin.products.controller");
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
// users
router.get("/products", auth_1.appAuth, auth_1.isAdmin, admin_products_controller_1.getProducts);
router.post("/products", auth_1.appAuth, auth_1.isAdmin, admin_products_controller_1.addNewProducts);
router.get("/products/:id", auth_1.appAuth, auth_1.isAdmin, admin_products_controller_1.getSingleProducts);
router.put("/products/:id", auth_1.appAuth, auth_1.isAdmin, admin_products_controller_1.updateProduct);
router.patch("/products/:id", auth_1.appAuth, auth_1.isAdmin, admin_products_controller_1.updateProduct);
// users
exports.default = router;
