"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFinance = exports.createNewFinance = exports.getAllFinance = void 0;
const CashFlow_1 = __importDefault(require("../models/CashFlow"));
const util_1 = require("../utils/util");
const Office_1 = __importDefault(require("../models/Admin/Office"));
const activityLog_1 = require("../utils/activityLog");
const OfficeWorker_1 = require("../models/Admin/OfficeWorker");
const mongoose_1 = require("mongoose");
const response_1 = require("../utils/response");
const getAllFinance = (req, res) => {
    const request = async () => {
        return await CashFlow_1.default.find();
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Finance records retrieved successfully",
        errorMessage: "Error retrieving finance records",
        statusCode: 200,
    });
};
exports.getAllFinance = getAllFinance;
const createNewFinance = (req, res) => {
    const user = req.user;
    const request = async () => {
        const singleOffice = await Office_1.default.findById(user.office);
        const checkIfCashFlowExists = await CashFlow_1.default.findOne({
            reference: req.body.reference,
        });
        if (checkIfCashFlowExists) {
            (0, response_1.errorResponse)(res, 401, "Finance record with this reference already exists");
            return;
        }
        const cashFlow = await CashFlow_1.default.create({
            ...req.body,
            created_by: user.id,
            office_id: new mongoose_1.Types.ObjectId(user?.office_id),
        });
        const log = await (0, activityLog_1.logActivity)({
            req,
            user_id: user?.user_id,
            action: "CREATE_FINANCE_RECORD",
            description: "Created a new finance record",
            sender: user?.user_id,
            receiver: user?.user_id,
            metadata: {
                cashFlowId: cashFlow.cashflow_id,
                officeId: user.office_id,
            },
        });
        const log2 = await (0, activityLog_1.logActivity)({
            req,
            user_id: user?.user_id,
            action: "UPDATE_OFFICE_WALLET",
            description: `Updated office wallet after ${req.body.type} transaction`,
            sender: user?.user_id,
            receiver: user?.user_id,
            metadata: {
                officeId: user.office_id,
                ...req.body,
                amount: req.body.amount,
                type: req.body.type,
            },
        });
        if (req.body.type === "inflow") {
            await Office_1.default.findByIdAndUpdate(user.office, {
                $push: {
                    transactions: cashFlow._id,
                    logs: [log._id, log2._id],
                    "wallet.logs": log2._id,
                },
                $set: {
                    "wallet.balance": singleOffice?.wallet?.balance + Number(req.body.amount),
                    "wallet.lastFundedBy": user?.user_id,
                    "wallet.lastFundedAmount": singleOffice?.wallet?.balance,
                },
            });
        }
        if (req.body.type === "outflow") {
            await Office_1.default.findByIdAndUpdate(user.office, {
                $push: {
                    transactions: cashFlow._id,
                    logs: [log._id, log2._id],
                },
                $set: {
                    "wallet.logs": log2._id,
                    "wallet.balance": singleOffice?.wallet?.balance <= 0
                        ? 0
                        : singleOffice?.wallet?.balance -
                            Number(req.body.amount),
                },
            });
        }
        await OfficeWorker_1.OfficeWorker.findByIdAndUpdate(user.id, {
            $push: { cash_flow: cashFlow._id, logs: log._id },
        });
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Finance record created successfully",
        errorMessage: "Error creating finance record",
        statusCode: 201,
    });
};
exports.createNewFinance = createNewFinance;
const updateFinance = (req, res) => {
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
            sender: user?.user_id,
            receiver: user?.user_id,
            metadata: {
                financeId,
                changes: req.body,
            },
        });
        // Update the office wallet if the amount or type has changed
        await Office_1.default.findByIdAndUpdate(user.office, {
            $push: { logs: log._id },
        });
        await OfficeWorker_1.OfficeWorker.findByIdAndUpdate(user.id, {
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
