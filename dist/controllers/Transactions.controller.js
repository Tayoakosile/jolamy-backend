"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTransaction = exports.getSingleTransaction = exports.getAllTransactions = void 0;
const CashFlow_1 = __importDefault(require("../models/CashFlow"));
const util_1 = require("../utils/util");
const Office_1 = __importDefault(require("../models/Admin/Office"));
const activityLog_1 = require("../utils/activityLog");
const OfficeWorker_1 = __importDefault(require("../models/Admin/OfficeWorker"));
const response_1 = require("../utils/response");
const Transaction_1 = __importDefault(require("../models/Transaction"));
const getAllTransactions = async (_req, res) => {
    console.log(" dd:");
    const user = _req.user;
    if (user?.user_role !== "admin") {
        const transactions = await Transaction_1.default.find({ user_id: user?._id });
        (0, response_1.successResponse)(res, 200, "Transactions retrieved successfully", {
            transactions,
        });
        return;
    }
    const transactions = await Transaction_1.default.find({});
    (0, response_1.successResponse)(res, 200, "Transactions retrieved successfully", {
        transactions,
    });
};
exports.getAllTransactions = getAllTransactions;
const getSingleTransaction = (req, res) => {
    const user = req.user;
    const transactionId = req.params.id;
    if (!transactionId) {
        (0, response_1.errorResponse)(res, 400, "Transaction ID is required");
        return;
    }
    const request = async () => {
        await (0, util_1.checkIfDocumentExistsById)(transactionId, "transaction_id", res, Transaction_1.default);
        const transaction = await Transaction_1.default.findOne({
            transaction_id: transactionId,
        })
            .populate({
            path: "logs",
        })
            .populate({
            path: "user_id",
            select: "first_name last_name address phone_number distributor_location email user_role",
        }).populate({
            path: "order_id",
            select: "order_number status products  delivery_address    payment_status delivery_status total_amount discount_amount",
        }).select("-internal_sequence -__v");
        if (user?.user_role !== "admin" &&
            transaction?.user_id.toString() !== user?._id.toString()) {
            (0, response_1.errorResponse)(res, 403, "You do not have permission to access this transaction");
            return;
        }
        return transaction;
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Transaction retrieved successfully",
        errorMessage: "Error retrieving transaction",
        statusCode: 200,
    });
};
exports.getSingleTransaction = getSingleTransaction;
const updateTransaction = (req, res) => {
    const user = req.user;
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
        await Office_1.default.findByIdAndUpdate(user.office, {
            $push: { logs: log._id },
        });
        await OfficeWorker_1.default.findByIdAndUpdate(user.id, {
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
exports.updateTransaction = updateTransaction;
