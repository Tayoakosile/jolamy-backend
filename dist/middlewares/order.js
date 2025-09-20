"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOrder = void 0;
const mongoose_1 = require("mongoose");
const Order_1 = __importDefault(require("../models/Order"));
const SalesAgentOrders_1 = __importDefault(require("../models/SalesAgentOrders"));
const response_1 = require("../utils/response");
const util_1 = require("../utils/util");
const validateOrder = async (req, res, next) => {
    const _req = req;
    const user = _req.user;
    const worker = _req.worker;
    const orderID = _req.params?.id;
    const order = !user?.is_sales_agent && !orderID?.includes("SAO")
        ? await (0, util_1.checkIfDocumentExistsById)(orderID, "order_number", res, Order_1.default, ["user_id"])
        : await (0, util_1.checkIfDocumentExistsById)(orderID, mongoose_1.Types.ObjectId.isValid(orderID) ? "_id" : "order_number", res, SalesAgentOrders_1.default, ["user_id"]);
    const isOrderAssignedToThisWorkerOffice = order?.assigned_to?.office?._id?.toString() === worker?.office?.toString();
    // Ensure both IDs are strings for comparison
    const checkIfOrderBelongsToUser = user?.orders.some((singleOrder) => String(singleOrder._id) === String(order?._id));
    // If payment made already or it is delivered, do not allow update
    if (_req.method !== "GET") {
        // order?.delivery_status === "delivered"
        if (order?.status === "completed" || order?.status === "cancelled") {
            (0, response_1.errorResponse)(res, 400, "Order cannot be updated", {
                message: `Order has already been ${order?.status}`,
            });
            return;
        }
    }
    if ((isOrderAssignedToThisWorkerOffice && worker?.worker_id) ||
        checkIfOrderBelongsToUser ||
        user?.user_role === "admin" ||
        (order?.role?.includes("sales_agent") &&
            order?.pickup?.distributor_id?.toString() === user?._id.toString())) {
        _req.order = order;
        next();
        return;
    }
    (0, response_1.errorResponse)(res, 404, "Order not found", {
        message: `Order not found or does not belong to this ${worker?.worker_id ? "Office" : "user"}`,
    });
    return;
};
exports.validateOrder = validateOrder;
