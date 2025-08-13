"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = void 0;
const Office_1 = __importDefault(require("../../models/Admin/Office"));
const CashFlow_1 = __importDefault(require("../../models/CashFlow"));
const Order_1 = __importDefault(require("../../models/Order"));
const User_1 = __importDefault(require("../../models/User"));
const response_1 = require("../../utils/response");
const trend_util_1 = require("../../utils/trend.util");
const getStats = async (_req, res) => {
    // get total users, total products, total orders, total cash flow in an object from mongoose db
    try {
        const totalUsers = await (0, trend_util_1.getTrend)(User_1.default, {
            period: "week",
            filter: { user_role: { $ne: "admin" } },
            // Exclude admin users
        });
        const totalProducts = await (0, trend_util_1.getTrend)(User_1.default, {
            period: "week",
        });
        const totalOrders = await (0, trend_util_1.getTrend)(Order_1.default, {
            period: "week",
        });
        const totalOffices = await (0, trend_util_1.getTrend)(Office_1.default, {
            period: "week",
        });
        //   How to add total amount from all cashflow
        const totalTransactions = await (0, trend_util_1.getTrend)(Office_1.default, {
            period: "week",
            sumField: "amount",
        });
        const totalCashFlow = await (0, trend_util_1.getTrend)(CashFlow_1.default, {
            period: "week",
            sumField: "amount",
        });
        console.log("totalUsers :", totalTransactions, totalUsers, totalProducts);
        (0, response_1.successResponse)(res, 200, "Stats fetched successfully", [
            { title: "Users", ...totalUsers },
            { title: "Products", ...totalProducts },
            { title: "Orders", ...totalOrders },
            { title: "Offices", ...totalOffices },
            { title: "Transactions", ...totalTransactions, type: "currency" },
            { title: "Cash Flow", ...totalCashFlow, type: "currency" },
        ]);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 500, "Error fetching stats");
    }
};
exports.getStats = getStats;
