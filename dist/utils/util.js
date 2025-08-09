"use strict";
// utils/checkIfExists.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeSensitiveFields = exports.timestamp = exports.customReqResHandler = exports.generateRandom = exports.checkIfDocumentExistsById = void 0;
exports.generateEntityNumber = generateEntityNumber;
const mongoose_1 = __importDefault(require("mongoose"));
const randomatic_1 = __importDefault(require("randomatic"));
const mail_service_1 = require("../services/mail.service");
const response_1 = require("./response");
/**
 * Checks if a user exists by ID.
 * @param id - The MongoDB ObjectId as string.
 * @param res - Res passed down.
 * @returns The user document if found, or null.
 * @throws Error if the ID is invalid or the DB fails.
 */
const checkIfDocumentExistsById = async (id, res, Model, populateFields) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        (0, response_1.errorResponse)(res, 400, "Invalid ID format", {
            message: "Invalid ID format",
        });
        return;
    }
    if (populateFields) {
        const populatedDocument = await Model.findById(id).populate(populateFields);
        if (!populatedDocument) {
            (0, response_1.errorResponse)(res, 404, "Document not found", {
                message: "Document not found",
            });
            return;
        }
        return populatedDocument;
    }
    const document = await Model.findById(id);
    if (!document) {
        (0, response_1.errorResponse)(res, 404, "Document not found", {
            message: "Document not found",
        });
        return;
    }
    return document;
};
exports.checkIfDocumentExistsById = checkIfDocumentExistsById;
const generateRandom = (howMuch) => {
    return (0, randomatic_1.default)("a0", howMuch || 18);
};
exports.generateRandom = generateRandom;
const customReqResHandler = async (res, reqFunction, errorFunction, responseData = {
    statusCode: 200,
    successMessage: "",
    data: null,
}, mailOptions = {
    shouldSendMail: false,
}) => {
    try {
        const response = await reqFunction();
        if (mailOptions.shouldSendMail) {
            await (0, mail_service_1.sendEmail)(mailOptions.mailTo, mailOptions.title, mailOptions.message);
        }
        return (0, response_1.successResponse)(res, responseData.statusCode, responseData.successMessage, responseData.data || response);
    }
    catch (error) {
        console.log("error :", error);
        errorFunction
            ? errorFunction(error)
            : (0, response_1.errorResponse)(res, responseData.errorStatusCode || 500, responseData.errorMessage, responseData.error || error);
    }
};
exports.customReqResHandler = customReqResHandler;
exports.timestamp = {
    createdAt: "created_at",
    updatedAt: "updated_at",
};
async function generateEntityNumber(entityPrefix, model) {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    // Find the latest entry for the current year+month
    const latest = await model
        .findOne({ entity_number: new RegExp(`^${entityPrefix}-${yearMonth}`) })
        .sort({ createdAt: -1 });
    let sequence = 1;
    if (latest) {
        const lastSeq = parseInt(latest.entity_number.split("-")[2], 10);
        sequence = lastSeq + 1;
    }
    return `${entityPrefix}-${yearMonth}-${(0, exports.generateRandom)(6)}-${String(sequence).padStart(4, "0")}`;
}
const removeSensitiveFields = (req, _res, next) => {
    const forbidden = [
        "payment_status",
        "estimated_date",
        "estimatedDate",
        "delivery_status",
        "refund_status",
        "order_number",
        "order_id",
        "internal_sequence",
        "total_amount",
        "discount_amount",
        "tax_amount",
        "tracking_number",
        "courier_service",
        "payment_reference",
        "createdAt",
        "updatedAt",
        "logs",
        "cancelled_at",
        "actual_delivery_date",
    ];
    forbidden.forEach((f) => delete req.body[f]);
    next();
};
exports.removeSensitiveFields = removeSensitiveFields;
