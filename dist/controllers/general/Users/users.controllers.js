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
    const users = await User_1.default.find({ status: "pending" });
    return res.status(200).json({ users });
};
exports.getPendingUsers = getPendingUsers;
const getAllUsers = async (_req, res) => {
    // Get all users not admin
    const period = "week";
    const user = _req.user;
    try {
        if (user?.is_admin) {
            const users = await User_1.default.find({ user_role: { $ne: "admin" } }).select("-_id -password -internal_sequence  -updatedAt -__v -logs -transaction_history");
            const allDistributors = await (0, trend_util_1.getTrend)(User_1.default, {
                period,
                filter: { user_role: "distributor" },
            });
            const allSalesAgents = await (0, trend_util_1.getTrend)(User_1.default, {
                period,
                filter: { user_role: "sales_agent" },
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
const getSingleUser = async (_req, res) => {
    // Get all users not admin
    const period = "week";
    try {
        const userInfo = _req.user;
        const param = _req.params.id;
        const user = await (0, util_1.checkIfDocumentExistsById)(param, "user_id", res, User_1.default, ["logs", "orders", "transaction_history", "approved_by"]);
        const user_id = user && new mongoose_1.Types.ObjectId(user?._id);
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
        const transaction = await (0, trend_util_1.getTrend)(Transaction_1.default, {
            period,
            filter: { user_id },
            sumField: "amount",
        });
        (0, response_1.successResponse)(res, 200, "User fetched successfully", {
            user,
            stats: [
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
                    ...transaction,
                },
            ],
        });
        return;
    }
    catch (error) {
        console.log("error :", error);
        return res.status(500).json({ error: "Error fetching user" });
    }
};
exports.getSingleUser = getSingleUser;
