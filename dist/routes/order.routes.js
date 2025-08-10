"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Order_controllers_1 = require("../controllers/Order.controllers");
const auth_1 = require("../middlewares/auth");
const util_1 = require("../utils/util");
const order_payments_controllers_1 = require("../controllers/order.payments.controllers");
const order_1 = require("../middlewares/order");
const router = (0, express_1.Router)();
router.get("/", auth_1.appAuth, auth_1.isWorker, Order_controllers_1.getAllOrders);
router.post("/", auth_1.appAuth, auth_1.isWorker, util_1.removeSensitiveFields, Order_controllers_1.createNewOrder);
router.get("/:id", auth_1.appAuth, auth_1.isWorker, Order_controllers_1.getAllOrders);
router.put("/:id", auth_1.appAuth, auth_1.isWorker, util_1.removeSensitiveFields, order_1.validateOrder, Order_controllers_1.updateOrder);
router.patch("/:id", auth_1.appAuth, auth_1.isWorker, util_1.removeSensitiveFields, order_1.validateOrder, Order_controllers_1.updateOrder);
// Initiate payment
router.put("/:id/initiate-payment", auth_1.appAuth, auth_1.isWorker, util_1.removeSensitiveFields, order_1.validateOrder, order_payments_controllers_1.initiatePayment);
// Initiate payment
router.put("/:id/verify-payment", auth_1.appAuth, auth_1.isWorker, util_1.removeSensitiveFields, order_1.validateOrder, order_payments_controllers_1.verifyPayment);
// Initiate payment
exports.default = router;
