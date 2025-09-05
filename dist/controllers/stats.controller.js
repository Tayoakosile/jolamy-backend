"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = void 0;
const Office_1 = __importDefault(require("../models/Admin/Office"));
const CashFlow_1 = __importDefault(require("../models/CashFlow"));
const Order_1 = __importDefault(require("../models/Order"));
const User_1 = __importDefault(require("../models/User"));
const response_1 = require("../utils/response");
const trend_util_1 = require("../utils/trend.util");
const getStats = async (req, res) => {
    const _req = req;
    // get total users, total products, total orders, total cash flow in an object from mongoose db
    const worker = _req.worker;
    const user = _req.user;
    const isUserAdmin = _req.isUserAdmin;
    if (isUserAdmin) {
        try {
            const totalUsers = await (0, trend_util_1.getTrend)(User_1.default, {
                period: "month",
                filter: { user_role: { $ne: "admin" } },
            });
            const totalProducts = await (0, trend_util_1.getTrend)(User_1.default, {
                period: "month",
            });
            const totalOrders = await (0, trend_util_1.getTrend)(Order_1.default, {
                period: "month",
            });
            const totalOffices = await (0, trend_util_1.getTrend)(Office_1.default, {
                period: "month",
            });
            //   How to add total amount from all cashflow
            const totalTransactions = await (0, trend_util_1.getTrend)(Office_1.default, {
                period: "month",
                sumField: "amount",
            });
            const totalCashFlow = await (0, trend_util_1.getTrend)(CashFlow_1.default, {
                period: "month",
                sumField: "amount",
            });
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
    }
    if (_req.isWorker) {
        try {
            const totalOrders = await (0, trend_util_1.getTrend)(Order_1.default, {
                period: "month",
                filter: {
                    assigned_to: {
                        office: { $eq: worker?.office },
                        office_worker: { $eq: worker?._id },
                        worker_handling_order: { $eq: worker?._id },
                    },
                },
            });
            //   How to add total amount from all cashflow
            // const totalTransactions = await getTrend(CashFlow, {
            //   period: "month",
            //   filter: {
            //     office_id: { $eq: worker?.office },
            //     created_by: { $eq: worker?._id },
            //   },
            // });
            const totalCashFlow = await (0, trend_util_1.getTrend)(CashFlow_1.default, {
                period: "month",
                filter: {
                    type: "inflow",
                    office_id: { $eq: worker?.office },
                    created_by: { $eq: worker?._id },
                },
            });
            const totalInflowCashFlow = await (0, trend_util_1.getTrend)(CashFlow_1.default, {
                period: "month",
                filter: {
                    type: "inflow",
                    office_id: { $eq: worker?.office },
                    created_by: { $eq: worker?._id },
                },
            });
            const totalOutflowCashFlow = await (0, trend_util_1.getTrend)(CashFlow_1.default, {
                period: "month",
                filter: {
                    type: "outflow",
                    office_id: { $eq: worker?.office },
                    created_by: { $eq: worker?._id },
                },
            });
            (0, response_1.successResponse)(res, 200, "Stats fetched successfully", [
                { title: "Orders In Charge", ...totalOrders },
                // { title: "Transactions", ...totalTransactions, type: "currency" },
                { title: "Total Cash Flow", ...totalCashFlow },
                { title: "Total Inflow Recorded", ...totalInflowCashFlow },
                { title: "Total Outflow Recorded", ...totalOutflowCashFlow },
            ]);
        }
        catch (error) {
            console.log("error :", error);
            (0, response_1.errorResponse)(res, 500, "Error fetching stats");
        }
    }
};
exports.getStats = getStats;
