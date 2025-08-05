"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewFinance = exports.getAllFinance = void 0;
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
    // console.log("req.user :", req.user?._id);
    const user = req.user;
    const request = async () => {
        const checkIfCashFlowExists = await CashFlow_1.default.findOne({
            reference: req.body.reference,
        });
        console.log("checkIfCashFlowExists :", checkIfCashFlowExists);
        if (checkIfCashFlowExists) {
            (0, response_1.errorResponse)(res, 401, "Finance record with this reference already exists");
            return;
        }
        const cashFlow = await CashFlow_1.default.create({
            ...req.body,
            created_by: user.id,
            office_id: new mongoose_1.Types.ObjectId(user?.office_id),
        });
        // await checkIfDocumentExistsById(user.office)
        const log = await (0, activityLog_1.logActivity)({
            req,
            userId: user._id,
            action: "CREATE_FINANCE_RECORD",
            description: "Created a new finance record",
            sender: user._id,
            receiver: user._id,
            metadata: {
                cashFlowId: cashFlow._id,
                officeId: user.office_id,
            },
        });
        const offices = await Office_1.default.findByIdAndUpdate(user.office, {
            $push: { transactions: cashFlow._id, logs: log._id },
        });
        console.log("offices :", offices);
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
