"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.initiatePayment = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const response_1 = require("../utils/response");
const activityLog_1 = require("../utils/activityLog");
const User_1 = __importDefault(require("../models/User"));
const initiatePayment = async (_req, res) => {
    try {
        const user = _req.user;
        const order = _req.order;
        const order_id = _req.params.id;
        const log = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: user._id,
            action: "initiate_payment",
            description: "User initiated payment for an order",
            receiver: user._id,
            sender: user._id,
            metadata: {
                order_id,
                total_amount: order.total_amount,
                payment_status: order.payment_status,
                delivery_status: order.delivery_status,
            },
        });
        await Order_1.default.findByIdAndUpdate(order_id, {
            payment_status: "initiated",
            $push: { logs: log.id },
        });
        await User_1.default.findByIdAndUpdate(user._id, {
            $push: { logs: log.id },
        });
        (0, response_1.successResponse)(res, 200, "Payment initiated successfully", {
            order_id,
            user_id: user._id,
            user_name: user.username,
            user_email: user.email,
            order_details: {
                total_amount: order.total_amount,
                payment_status: order.payment_status,
                delivery_status: order.delivery_status,
            },
        });
    }
    catch (error) {
        console.error("Error initiating payment:", error);
        res.status(500).json({
            message: "An error occurred while initiating payment",
            error: error || "Internal Server Error",
        });
    }
};
exports.initiatePayment = initiatePayment;
const verifyPayment = async (_req, res) => {
    try {
        const user = _req.user;
        const order = _req.order;
        const order_id = _req.params.id;
        const log = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: user._id,
            action: "initiate_payment",
            description: "User initiated payment for an order",
            receiver: user._id,
            sender: user._id,
            metadata: {
                order_id,
                total_amount: order.total_amount,
                payment_status: order.payment_status,
                delivery_status: order.delivery_status,
            },
        });
        await Order_1.default.findByIdAndUpdate(order_id, {
            payment_status: "initiated",
            $push: { logs: log.id },
        });
        await User_1.default.findByIdAndUpdate(user._id, {
            $push: { logs: log.id },
        });
        (0, response_1.successResponse)(res, 200, "Payment initiated successfully", {
            order_id,
            user_id: user._id,
            user_name: user.username,
            user_email: user.email,
            order_details: {
                total_amount: order.total_amount,
                payment_status: order.payment_status,
                delivery_status: order.delivery_status,
            },
        });
    }
    catch (error) {
        console.error("Error initiating payment:", error);
        res.status(500).json({
            message: "An error occurred while initiating payment",
            error: error || "Internal Server Error",
        });
    }
};
exports.verifyPayment = verifyPayment;
