"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOrder = void 0;
const response_1 = require("../utils/response");
const util_1 = require("../utils/util");
const Order_1 = __importDefault(require("../models/Order"));
const validateOrder = async (_req, res, next) => {
    const user = _req.user;
    const orderID = _req.params?.id;
    const order = await (0, util_1.checkIfDocumentExistsById)(orderID, res, Order_1.default);
    const checkIfOrderBelongsToUser = user?.orders.find((order) => order._id.toString() === orderID);
    // If payment made already or it is delivered, do not allow update
    if (order?.payment_status === "paid" ||
        order?.delivery_status === "delivered") {
        (0, response_1.errorResponse)(res, 400, "Order cannot be updated", {
            message: "Order has already been paid or delivered",
        });
        return next();
    }
    if (!checkIfOrderBelongsToUser) {
        (0, response_1.errorResponse)(res, 404, "Order not found", {
            message: "Order not found or does not belong to the user",
        });
        return next();
    }
    _req.order = order;
    next();
};
exports.validateOrder = validateOrder;
