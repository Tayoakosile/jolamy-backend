"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Order_controllers_1 = require("../controllers/Order.controllers");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get("/", auth_1.appAuth, auth_1.isWorker, Order_controllers_1.getAllOrders);
// router.post("/", appAuth, isWorker, createNewFinance);
// // edit cash flow
// router.put("/:id", appAuth, isWorker, updateFinance);
// router.patch("/:id", appAuth, isWorker, updateFinance);
// Add to cart API
exports.default = router;
