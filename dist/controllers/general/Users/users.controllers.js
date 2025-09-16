"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSingleUser = exports.getAllUsers = exports.getPendingUsers = void 0;
const User_1 = __importDefault(require("../../../models/User"));
const response_1 = require("../../../utils/response");
const util_1 = require("../../../utils/util");
// import { getTrend } from "../../../utils/trend.util";
const mongoose_1 = require("mongoose");
const Bonus_1 = __importDefault(require("../../../models/Bonus"));
const Order_1 = __importDefault(require("../../../models/Order"));
const Transaction_1 = __importDefault(require("../../../models/Transaction"));
const trend_util_1 = require("../../../utils/trend.util");
const getPendingUsers = async (_req, res) => {
    const users = await User_1.default.find({
        status: {
            $in: [
                "inactive",
                "pending_for_documents",
                "awaiting_registration_fee_payment",
                "submitted_for_review",
                "pending_for_approval",
            ],
        },
    });
    (0, response_1.successResponse)(res, 200, "Pending Users fetched successfully", { users });
    return;
};
exports.getPendingUsers = getPendingUsers;
const getAllUsers = async (req, res) => {
    // Get all users not admin
    const _req = req;
    const orderStatus = _req.query?.status;
    const period = "week";
    const user = _req.user;
    const worker = _req.worker;
    const orderStatusContained = orderStatus
        ? ["pending_for_documents", "submitted_for_review", "pending_for_approval"]
        : ["approved"];
    try {
        if (user?.is_admin) {
            const users = await User_1.default.find({
                user_role: { $ne: "admin" },
                status: {
                    $in: orderStatusContained,
                },
            }).select("-_id -password -internal_sequence  -updatedAt -__v -logs -transaction_history");
            const allDistributors = await (0, trend_util_1.getTrend)(User_1.default, {
                period,
                filter: {
                    user_role: "distributor",
                    status: orderStatus ? { $nin: ["approved", "deleted"] } : "approved",
                },
            });
            const allSalesAgents = await (0, trend_util_1.getTrend)(User_1.default, {
                period,
                filter: {
                    user_role: "sales_agent",
                    status: orderStatus ? { $nin: ["approved", "deleted"] } : "approved",
                },
            });
            (0, response_1.successResponse)(res, 200, "Users fetched successfully", {
                users,
                stats: [
                    {
                        title: "distributor",
                        ...allDistributors,
                    },
                    {
                        title: "sales_agent",
                        ...allSalesAgents,
                    },
                ],
            });
        }
        return;
    }
    catch (error) {
        return res.status(500).json({ error: "Error fetching users" });
    }
};
exports.getAllUsers = getAllUsers;
const getSingleUser = async (req, res) => {
    // Get all users not admin
    const _req = req;
    const period = "week";
    try {
        const param = _req.params.id;
        const user = await (0, util_1.checkIfDocumentExistsById)(param, "user_id", res, User_1.default, ["logs", "orders", "transaction_history", "approved_by"]);
        const user_id = user && new mongoose_1.Types.ObjectId(user?._id);
        const boxes_in_stock = {
            // {
            //   currentTotal: number;
            //   previousTotal: number;
            //   percentageChange: number;
            //   trend: "increase" | "decrease" | "no-change";
            // }
            currentTotal: `${user?.total_boxes_in_stock} Boxes` || 0,
            previousTotal: 0,
            percentageChange: 0,
            trend: "no-change",
        };
        const order = await (0, trend_util_1.getTrend)(Order_1.default, {
            period,
            filter: { user_id },
        });
        const pending_orders = await (0, trend_util_1.getTrend)(Order_1.default, {
            period,
            filter: {
                user_id: user && new mongoose_1.Types.ObjectId(user?.id),
                status: { $in: ["pending", "processing"] },
            },
        });
        const completed_orders = await (0, trend_util_1.getTrend)(Order_1.default, {
            period,
            filter: { user_id, status: "completed" },
        });
        const bonus = await (0, trend_util_1.getTrend)(Bonus_1.default, {
            period,
            filter: { user_id },
            sumField: "amount",
        });
        const transactions = await (0, trend_util_1.getTrend)(Transaction_1.default, {
            period,
            filter: { user_id },
            sumField: "total",
        });
        (0, response_1.successResponse)(res, 200, "User fetched successfully", {
            user,
            stats: [
                {
                    title: "Boxes in Stock",
                    ...boxes_in_stock,
                },
                {
                    title: "Total Orders",
                    ...order,
                },
                {
                    title: "Pending Orders",
                    ...pending_orders,
                },
                {
                    title: "Completed Orders",
                    ...completed_orders,
                },
                {
                    title: "Total Bonuses",
                    ...bonus,
                    type: "currency",
                },
                {
                    title: "Total Transactions",
                    type: "currency",
                    ...transactions,
                },
            ],
        });
        return;
    }
    catch (error) {
        return res.status(500).json({ error: "Error fetching user" });
    }
};
exports.getSingleUser = getSingleUser;
