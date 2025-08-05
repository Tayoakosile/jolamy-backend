"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewOrder = exports.getAllOrders = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const util_1 = require("../utils/util");
const getAllOrders = (_req, res) => {
    const id = _req.user?._id;
    const request = async () => {
        return await Order_1.default.find({ user_id: id });
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Orders retrieved successfully",
        errorMessage: "Error retrieving orders",
        statusCode: 200,
    });
};
exports.getAllOrders = getAllOrders;
const createNewOrder = (_req, res) => {
    const id = _req.user?._id;
    const body = _req.body;
    const request = async () => {
        const order = await Order_1.default.create({
            ...body,
            status: "pending",
            user_id: id,
            order_number: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        });
        return order;
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Order created successfully",
        errorMessage: "Error creating order",
        statusCode: 201,
    });
};
exports.createNewOrder = createNewOrder;
