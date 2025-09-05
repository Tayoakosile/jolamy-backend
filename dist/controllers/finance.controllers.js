"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSingleFinance = exports.updateFinance = exports.createNewFinance = exports.getAllFinance = void 0;
const Office_1 = __importDefault(require("../models/Admin/Office"));
const OfficeWorker_1 = __importDefault(require("../models/Admin/OfficeWorker"));
const CashFlow_1 = __importDefault(require("../models/CashFlow"));
const activityLog_1 = require("../utils/activityLog");
const response_1 = require("../utils/response");
const trend_util_1 = require("../utils/trend.util");
const util_1 = require("../utils/util");
const getAllFinance = (req, res) => {
    // Only admin and worker can access this route
    if (req.isOtherUser) {
        (0, response_1.errorResponse)(res, 401, "Not authorized, worker/admin access only", {
            message: "Not authorized, worker/admin access only",
        });
        return;
    }
    const worker = req?.worker;
    const request = async () => {
        if (req.isWorker) {
            return await CashFlow_1.default.find({
                office_id: worker?.office,
                created_by: worker?._id,
            }).populate({
                path: "created_by",
                select: "first_name last_name email worker_id user_id role",
            });
        }
        if (req.isUserAdmin) {
            const allTransactions = await (0, trend_util_1.getTrend)(CashFlow_1.default, {
                period: "week",
            });
            const transactionTotal = await (0, trend_util_1.getTrend)(CashFlow_1.default, {
                period: "week",
                sumField: "amount",
            });
            const allInflowTransactions = await (0, trend_util_1.getTrend)(CashFlow_1.default, {
                period: "week",
                filter: { type: "inflow" },
            });
            const allOutflowTransactions = await (0, trend_util_1.getTrend)(CashFlow_1.default, {
                period: "week",
                filter: { type: "inflow" },
            });
            // const allTransactions = await getTrend(CashFlow, {
            //   period: "week",
            // });
            const adminCashFlow = await CashFlow_1.default.find().populate([
                {
                    path: "created_by",
                    select: "first_name last_name email worker_id user_id role",
                },
                {
                    path: "office_id",
                    select: "name address office_id _id",
                },
            ]);
            return {
                stats: [
                    {
                        title: "Total CashFlow Counts",
                        ...allTransactions,
                        // type: "currency",
                    },
                    {
                        title: "Inflow Transactions",
                        ...allInflowTransactions,
                        // type: "currency",
                    },
                    {
                        title: "Outflow Transactions",
                        ...allOutflowTransactions,
                        // type: "currency",
                    },
                    { title: "Total Amount", ...transactionTotal, type: "currency" },
                ],
                cashFlows: adminCashFlow,
            };
        }
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Finance records retrieved successfully",
        errorMessage: "Error retrieving finance records",
        statusCode: 200,
    });
};
exports.getAllFinance = getAllFinance;
const createNewFinance = (req, res) => {
    const user = req?.worker;
    const isOtherUser = req.isOtherUser;
    const isWorker = req.isWorker;
    if (isWorker && isOtherUser) {
        (0, response_1.errorResponse)(res, 401, "Not authorized, worker/admin access only", {
            message: "Not authorized, worker/admin access only",
        });
        return;
    }
    const amount = Number(req.body.amount);
    const request = async () => {
        const singleOffice = (await Office_1.default.findById(user?.office));
        const checkIfCashFlowExists = await CashFlow_1.default.findOne({
            reference: req.body.reference,
        });
        if (checkIfCashFlowExists) {
            (0, response_1.errorResponse)(res, 400, "Finance record with this reference already exists");
            return;
        }
        const cashFlow = await CashFlow_1.default.create({
            ...req.body,
            created_by: user?.id,
            office_id: user?.office,
        });
        const log = await (0, activityLog_1.logActivity)({
            req,
            user_id: user?.id,
            action: "CREATE_FINANCE_RECORD",
            description: "  Created a new finance record",
            sender: user?._id,
            receiver: user?._id,
            metadata: {
                cashFlowId: cashFlow.cashflow_id,
                officeId: user?.office_id,
            },
        });
        const log2 = await (0, activityLog_1.logActivity)({
            req,
            user_id: user?.id,
            action: "UPDATE_OFFICE_WALLET",
            description: `Updated office wallet after ${req.body.type} transaction`,
            sender: user?._id,
            receiver: user?._id,
            metadata: {
                officeId: user?.office_id,
                ...req.body,
                amount: req.body.amount,
                type: req.body.type,
            },
        });
        if (req.body.type === "outflow") {
            await Office_1.default.findByIdAndUpdate(singleOffice._id, {
                $expr: {
                    $gte: [
                        "$wallet.balance",
                        singleOffice?.wallet && Number(singleOffice?.wallet?.balance) <= 0
                            ? 0
                            : amount,
                    ],
                },
                $push: {
                    transactions: cashFlow._id,
                    logs: { $each: [log._id, log2._id] },
                    "wallet.logs": log2._id,
                },
                $inc: {
                    "wallet.balance": Number(singleOffice?.wallet?.balance) <= 0 ? 0 : -amount,
                },
            });
        }
        else if (req.body.type === "inflow") {
            await Office_1.default.findByIdAndUpdate(singleOffice._id, {
                $push: {
                    transactions: cashFlow._id,
                    logs: { $each: [log._id, log2._id] },
                    "wallet.logs": log2._id,
                },
                $inc: { "wallet.balance": amount },
            });
        }
        await OfficeWorker_1.default.findByIdAndUpdate(user?._id, {
            $push: { cash_flow: cashFlow._id, logs: log._id },
        });
        return cashFlow;
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Finance record created successfully",
        errorMessage: "Error creating finance record",
        statusCode: 201,
    });
};
exports.createNewFinance = createNewFinance;
const updateFinance = (req, res) => {
    const user = req.worker;
    if (!req.body) {
        (0, response_1.errorResponse)(res, 400, "Request body is required");
        return;
    }
    const request = async () => {
        const financeId = req.params.id;
        await (0, util_1.checkIfDocumentExistsById)(financeId, "cashflow_id", res, CashFlow_1.default);
        const updatedFinance = await CashFlow_1.default.findOneAndUpdate({ cashflow_id: financeId }, { ...req.body }, { new: true });
        // Log the update activity
        const log = await (0, activityLog_1.logActivity)({
            req,
            user_id: user?.user_id,
            action: "UPDATE_FINANCE_RECORD",
            description: `Updated finance record with ID ${financeId}`,
            sender: user?._id,
            receiver: user?._id,
            metadata: {
                financeId,
                changes: req.body,
            },
        });
        // Update the office wallet if the amount or type has changed
        await Office_1.default.findByIdAndUpdate(user?.office, {
            $push: { logs: log._id },
        });
        await OfficeWorker_1.default.findByIdAndUpdate(user?.id, {
            $push: { logs: log._id },
        });
        return updatedFinance;
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Finance record updated successfully",
        errorMessage: "Error updating finance record",
        statusCode: 200,
    });
};
exports.updateFinance = updateFinance;
const getSingleFinance = (req, res) => {
    const user = req.worker;
    const request = async () => {
        const financeId = req.params.id;
        const SingleFinance = await (0, util_1.checkIfDocumentExistsById)(financeId, "cashflow_id", res, CashFlow_1.default, ["created_by", "office_id"]);
        if (!SingleFinance && !req.isWorker) {
            (0, response_1.errorResponse)(res, 404, "Finance record not found");
            return;
        }
        // Log the update activity
        const log = await (0, activityLog_1.logActivity)({
            req,
            user_id: user?.user_id,
            action: "VIEW_FINANCE_RECORD",
            description: `  Viewed finance record with ID ${financeId}`,
            sender: user?._id,
            receiver: user?._id,
            metadata: {
                financeId,
            },
        });
        // Update the office wallet if the amount or type has changed
        await Office_1.default.findByIdAndUpdate(user?.office, {
            $push: { logs: log._id },
        });
        await OfficeWorker_1.default.findByIdAndUpdate(user?.id, {
            $push: { logs: log._id },
        });
        if (req.isWorker) {
            if (SingleFinance?.office_id?._id?.toString() !== user?.office?.toString()) {
                (0, response_1.errorResponse)(res, 404, "Finance record details not found");
                return;
            }
        }
        return SingleFinance;
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Finance record retrieved successfully",
        errorMessage: "Error retrieving finance record",
        statusCode: 200,
    });
};
exports.getSingleFinance = getSingleFinance;
