"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.initiatePaymentWithPaystack = exports.initiatePayment = void 0;
const axios_1 = __importDefault(require("axios"));
const Order_1 = __importDefault(require("../models/Order"));
const User_1 = __importDefault(require("../models/User"));
const activityLog_1 = require("../utils/activityLog");
const response_1 = require("../utils/response");
const mongoose_1 = require("mongoose");
const Cart_1 = require("../models/Cart");
const util_1 = require("../utils/util");
const mail_service_1 = require("../services/mail.service");
const Transaction_1 = __importDefault(require("../models/Transaction"));
const Office_1 = __importDefault(require("../models/Admin/Office"));
const initiatePayment = async (_req, res) => {
    try {
        const user = _req.user;
        const order = _req.order;
        const order_id = _req.params.id;
        const log = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: user?._id,
            action: "INITIATE_PAYMENT",
            description: `${user?.full_name} initiated payment for order ${order_id}`,
            receiver: user._id,
            sender: new mongoose_1.Types.ObjectId(`${user._id}`),
            metadata: {
                order_id,
                total_amount: order.total_amount,
                payment_status: order.payment_status,
                delivery_status: order.delivery_status,
            },
        });
        await Order_1.default.findOneAndUpdate({ order_number: order_id }, {
            payment_status: "initiated",
            $push: { logs: log.id },
        });
        await User_1.default.findByIdAndUpdate(user._id, {
            $push: { logs: log.id },
        });
        (0, response_1.successResponse)(res, 200, "Payment initiated successfully", {
            order_id,
            user_id: user?.user_id,
            user_name: user.username,
            user_email: user.email,
            order_details: {
                total_amount: order.total_amount,
                payment_status: order.payment_status,
                delivery_status: order.delivery_status,
            },
        });
        return;
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
const initiatePaymentWithPaystack = async (order_id) => {
    return await axios_1.default.post("https://api.paystack.co/transaction/initialize", {
        email: "oluwatayoakosile@gmail.com",
        amount: Number(2000) * 100, // Paystack expects amount in kobo
        metadata: {
            cart_id: order_id,
        },
    }, {
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
        },
    });
};
exports.initiatePaymentWithPaystack = initiatePaymentWithPaystack;
const verifyPayment = async (_req, res) => {
    try {
        const user = _req.user;
        const order = _req.order;
        if (order.payment_status !== "initiated") {
            res.status(400).json({
                message: "Payment has not been initiated for this order",
            });
            return;
        }
        const order_id = _req.params.id;
        const reference = _req.body?.reference;
        if (!reference) {
            return res.status(400).json({
                message: "Payment reference is required",
            });
        }
        const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        });
        // console.log("response :", response.data?.data);
        const responseFromPaystack = response.data?.data;
        const status = (responseFromPaystack?.status ||
            "unknown");
        // return;
        // automatically assign order to an office and then log
        if (util_1.statusMap[status] === "paid"
        // &&responseFromPaystack?.metadata?.cart_id == order_id?.toString()
        ) {
            const office_to_be_in_charge = await Office_1.default.aggregate([
                { $match: { is_active: true } },
                { $addFields: { orderCount: { $size: "$orders" } } },
                { $sort: { orderCount: 1 } }, // smallest first
                { $limit: 1 },
            ]);
            const transaction = await Transaction_1.default.findByIdAndUpdate(order?._id, {
                status: "completed",
                payment_method: "Paystack",
            });
            const log = await (0, activityLog_1.logActivity)({
                req: _req,
                user_id: user?.id,
                action: "COMPLETED_PAYMENT",
                description: `User completed payment for this order, id: ${order?.order_number} and the payment was successful`,
                receiver: user._id,
                sender: new mongoose_1.Types.ObjectId(`${user._id}`),
                metadata: {
                    order_id,
                    total_amount: order.total_amount,
                    payment_status: "paid",
                    payment_reference: response.data?.data?.reference,
                    transaction_id: transaction?.transaction_id,
                },
            });
            // Log that order was asssinged to this office
            const officeLog = await (0, activityLog_1.logActivity)({
                req: _req,
                user_id: user?._id,
                action: "ASSIGNED_ORDER_TO_OFFICE",
                description: `Order ${order_id} has been assigned to office ${office_to_be_in_charge[0]?.name}`,
                receiver: office_to_be_in_charge[0]?._id || user._id,
                sender: new mongoose_1.Types.ObjectId(`${user._id}`),
                metadata: {
                    order_id,
                    office_id: office_to_be_in_charge[0]?._id,
                    office_name: office_to_be_in_charge[0]?.name,
                },
            });
            await Office_1.default.findByIdAndUpdate(office_to_be_in_charge[0]?._id, {
                $push: {
                    orders: new mongoose_1.Types.ObjectId(order?.id),
                    logs: {
                        $each: [
                            new mongoose_1.Types.ObjectId(log.id),
                            new mongoose_1.Types.ObjectId(officeLog.id),
                        ],
                    },
                },
            });
            // return;
            await Order_1.default.findOneAndUpdate({ order_number: order_id }, {
                payment_status: "paid",
                delivery_status: "processing",
                status: "processing",
                payment_method: "Paystack",
                payment_reference: response.data?.data?.reference,
                $push: {
                    logs: {
                        $each: [log._id, officeLog.id],
                    },
                },
                assigned_to: {
                    office: office_to_be_in_charge[0]?._id || null,
                    office_worker: null,
                },
            });
            await User_1.default.findByIdAndUpdate(user._id, {
                $push: {
                    logs: {
                        $each: [
                            new mongoose_1.Types.ObjectId(log.id),
                            new mongoose_1.Types.ObjectId(officeLog.id),
                        ],
                    },
                },
                $inc: {
                    total_boxes_in_stock: Number(order?.total_quantity || 0),
                },
            });
            //   find the cart and delete it items array, if the id is in items then delete the collection
            await Cart_1.Cart.findOneAndUpdate({ user_id: user?.id, order_id }, { $pull: { items: { order_id } } });
            await Cart_1.Cart.findByIdAndDelete(user.id, {
                $or: [{ user_id: user._id }, { order_id }],
            });
            (0, mail_service_1.sendEmail)(user.email, "Payment Successful", `Your payment for order ${order_id} has been successfully verified. Thank you for your purchase!`);
            (0, response_1.successResponse)(res, 200, "Payment verified successfully", {
                order_id,
                user_id: user?.user_id,
                user_name: user.username,
                user_email: user.email,
                order_details: {
                    total_amount: order && order.total_amount,
                    payment_status: order && order.payment_status,
                    delivery_status: order && order.delivery_status,
                },
            });
            return;
        }
        if (util_1.statusMap[status] === "pending") {
            const log = await (0, activityLog_1.logActivity)({
                req: _req,
                user_id: user?._id,
                action: "VERIFIED_PAYMENT",
                description: `User verified payment for this order, id: ${order?.user_id} but the payment is still pending`,
                receiver: user._id,
                sender: new mongoose_1.Types.ObjectId(`${user._id}`),
                metadata: {
                    order_id,
                    total_amount: order.total_amount,
                    payment_status: "pending",
                    payment_reference: response.data?.data?.reference,
                },
            });
            await Order_1.default.findByIdAndUpdate(order_id, {
                $push: { logs: new mongoose_1.Types.ObjectId(log.id) },
            });
            await User_1.default.findByIdAndUpdate(user._id, {
                $push: { logs: new mongoose_1.Types.ObjectId(log.id) },
            });
            (0, response_1.successResponse)(res, 202, "Payment is pending", {
                order_id,
                user_id: user?.user_id,
                user_name: user.username,
                user_email: user.email,
                order_details: {
                    total_amount: order.total_amount,
                    payment_status: order.payment_status,
                    delivery_status: order.delivery_status,
                },
            });
            return;
        }
        if (["failed", "reversed", "abandoned"].includes(status)) {
            const log = await (0, activityLog_1.logActivity)({
                req: _req,
                user_id: user?._id,
                action: "FAILED_PAYMENT",
                description: `User payment for this order, id: ${order?.order_number} has failed or been reversed`,
                receiver: user._id,
                sender: new mongoose_1.Types.ObjectId(`${user._id}`),
                metadata: {
                    order_id,
                    total_amount: order.total_amount,
                    payment_status: "failed",
                    payment_reference: response.data?.data?.reference,
                },
            });
            await Order_1.default.findByIdAndUpdate(order_id, {
                payment_status: util_1.statusMap[status],
                $push: { logs: new mongoose_1.Types.ObjectId(log.id) },
                status: util_1.statusMap[status],
            });
            await User_1.default.findByIdAndUpdate(user._id, {
                $push: { logs: new mongoose_1.Types.ObjectId(log.id) },
            });
            (0, mail_service_1.sendEmail)(user.email, "Payment Failed", `Your payment for order ${order_id} has failed or been reversed. Please try again or contact support.`);
            (0, response_1.errorResponse)(res, 400, "Payment failed,abadoned or reversed", {
                order_id,
                user_id: user?.user_id,
                user_name: user.username,
                user_email: user.email,
                order_details: {
                    total_amount: order.total_amount,
                    payment_status: order.payment_status,
                    delivery_status: order.delivery_status,
                },
            });
            return;
        }
        (0, response_1.errorResponse)(res, 400, "Payment Not Confirmed", {
            order_id,
            user_id: user?.user_id,
            user_name: user.username,
            user_email: user.email,
            order_details: {
                total_amount: order.total_amount,
                payment_status: order.payment_status,
                delivery_status: order.delivery_status,
            },
        });
        return;
    }
    catch (error) {
        console.error("Error initiating payment:", error?.response?.data || error);
        res.status(500).json({
            message: "An error occurred while Verifying payment",
            error: error || "Internal Server Error",
        });
    }
};
exports.verifyPayment = verifyPayment;
