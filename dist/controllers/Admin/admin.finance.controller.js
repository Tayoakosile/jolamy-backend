"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminFundWallet = exports.updateOffice = exports.createNewOffices = exports.getSingleCashFlow = exports.getAllCashFlow = void 0;
const Office_1 = __importDefault(require("../../models/Admin/Office"));
const User_1 = __importDefault(require("../../models/User"));
const activityLog_1 = require("../../utils/activityLog");
const response_1 = require("../../utils/response");
const util_1 = require("../../utils/util");
const CashFlow_1 = __importDefault(require("../../models/CashFlow"));
const mongoose_1 = require("mongoose");
const getAllCashFlow = async (req, res) => {
    const request = async () => {
        return await CashFlow_1.default.find();
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "CashFlows retrieved successfully",
        errorMessage: "Error retrieving cash flows",
        statusCode: 200,
    });
};
exports.getAllCashFlow = getAllCashFlow;
const getSingleCashFlow = async (req, res) => {
    const _req = req;
    const id = _req.params.id;
    const cash_flow = await (0, util_1.checkIfDocumentExistsById)(id, "office_id", res, Office_1.default, ["created_by", "logs"]);
    const request = async () => {
        const log = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: new mongoose_1.Types.ObjectId(_req.user?._id),
            action: "GET_SINGLE_CASH_FLOW",
            description: "Retrieved cash flow successfully",
            metadata: {
                ...cash_flow,
                user_id: `${_req.user?._id}`,
            },
        });
        await User_1.default.findByIdAndUpdate(_req.user?._id, {
            $push: { logs: log._id },
        });
        return cash_flow;
    };
    await (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "CashFlow retrieved successfully",
        errorMessage: "Error retrieving office",
        statusCode: 200,
    });
};
exports.getSingleCashFlow = getSingleCashFlow;
/**
 *
 *
 * @param {AuthRequest} req
 * @param {Response} res
 */
const createNewOffices = async (_req, res) => {
    const req = _req;
    const request = async () => {
        const existingOffice = await Office_1.default.exists({})
            .where("name")
            .equals(req.body.name);
        if (existingOffice) {
            (0, response_1.errorResponse)(res, 400, "Office with this name already exists", {
                message: "Office with this name already exists",
            });
            return;
        }
        const newOffice = await Office_1.default.create({
            ...req.body,
            created_by: req.user?._id,
        });
        const log = await (0, activityLog_1.logActivity)({
            req,
            user_id: new mongoose_1.Types.ObjectId(req.user?._id),
            action: "CREATE_OFFICE",
            description: "New office created",
            metadata: {
                ...newOffice,
                user_id: `${req.user?._id}`,
            },
        });
        newOffice.logs = Array.isArray(newOffice.logs)
            ? [...newOffice.logs, log._id]
            : [log._id];
        await newOffice.save();
        await User_1.default.findByIdAndUpdate(req.user?._id, {
            $push: { logs: log._id },
        });
        return newOffice;
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "New office created successfully",
        errorMessage: "Error creating new office",
        statusCode: 201,
        errorStatusCode: 400,
    }, {
        shouldSendMail: true,
        mailTo: req.user?.email,
        title: "New Office Created",
        message: `A new office has been created with the name ${req.body.name}.`,
    });
};
exports.createNewOffices = createNewOffices;
const updateOffice = async (_req, res) => {
    const req = _req;
    const id = req.params.id;
    await (0, util_1.checkIfDocumentExistsById)(id, "office_id", res, Office_1.default);
    const request = async () => {
        const updatedOffice = (await Office_1.default.findByIdAndUpdate(id, { ...req.body }, { new: true }));
        const log = await (0, activityLog_1.logActivity)({
            req,
            user_id: new mongoose_1.Types.ObjectId(req.user?._id),
            action: "UPDATE_OFFICE",
            description: "Office updated successfully",
            metadata: {
                ...updatedOffice,
                user_id: `${req.user?._id}`,
            },
        });
        updatedOffice.logs = Array.isArray(updatedOffice.logs)
            ? [...updatedOffice.logs, log._id]
            : [log._id];
        await updatedOffice.save();
        await User_1.default.findByIdAndUpdate(req.user?._id, {
            $push: { logs: log._id },
        });
        return updatedOffice;
    };
    await (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Office updated successfully",
        errorMessage: "Error updating office",
        statusCode: 200,
    });
};
exports.updateOffice = updateOffice;
const adminFundWallet = async (_req, res) => {
    const req = _req;
    const officeId = req.params.id;
    const request = async () => {
        const office = await (0, util_1.checkIfDocumentExistsById)(officeId, "office_id", res, Office_1.default);
        if (!office) {
            (0, response_1.errorResponse)(res, 404, "Office not found");
            return;
        }
        // Assuming the amount to fund is passed in the request body
        const amount = Number(req.body.amount);
        if (!amount || amount <= 0) {
            (0, response_1.errorResponse)(res, 400, "Invalid amount to fund");
            return;
        }
        // Update the office wallet balance
        if (!office.wallet) {
            office.wallet = { balance: 0 };
        }
        office.wallet.balance += amount;
        // Log the funding activity
        const log = await (0, activityLog_1.logActivity)({
            req,
            user_id: new mongoose_1.Types.ObjectId(req.user?._id),
            description: `Wallet funded by ${req.user?.first_name} ${req.user?.last_name} with amount ${amount}`,
            action: "FUND_OFFICE_WALLET",
            metadata: {
                office_id: officeId,
                funded_amount: amount,
                user_id: `${req.user?._id}`,
            },
        });
        office.logs = Array.isArray(office.logs)
            ? [...office.logs, log._id]
            : [log._id];
        const cashflow = await CashFlow_1.default.create({
            type: "inflow",
            office_id: office._id,
            amount,
            description: `Office wallet funded: ${office.name} with amount ${amount}`,
            attachments: req.body.attachments || [],
            office: office._id,
            notes: req.body.notes || "",
            reference: `FUND-${office.office_id}-${Date.now()}`,
            status: "completed",
            created_by: req.user?._id,
            metadata: {
                funded_by: req.user?._id,
                office_id: office._id,
                office_name: office.name,
            },
        });
        office.transactions = Array.isArray(office.transactions)
            ? [...office.transactions, cashflow._id]
            : [cashflow._id];
        office.wallet.last_funded_by = req.user?._id;
        office.wallet.last_funded_amount = amount;
        office.wallet.logs = Array.isArray(office.wallet.logs)
            ? [...office.wallet.logs, log._id]
            : [log._id];
        await office.save();
        await User_1.default.findByIdAndUpdate(req.user?._id, {
            $push: { logs: log._id },
        });
        return { message: "Wallet funded successfully", office };
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Wallet funded successfully",
        errorMessage: "Error funding wallet",
        statusCode: 200,
    });
};
exports.adminFundWallet = adminFundWallet;
