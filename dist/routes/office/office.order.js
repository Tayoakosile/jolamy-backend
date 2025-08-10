"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const office_controllers_1 = require("../../controllers/Office/office.controllers");
const auth_1 = require("../../middlewares/auth");
const order_1 = require("../../middlewares/order");
const router = (0, express_1.Router)();
router.get("/", auth_1.appAuth, auth_1.isWorker, order_1.validateOrder, office_controllers_1.getAllOfficeOrders);
