"use strict";
// utils/checkIfExists.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timestamp = exports.customReqResHandler = exports.getRandom = exports.checkIfDocumentExistsById = void 0;
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
        return (0, response_1.errorResponse)(res, 400, "Invalid ID format", {
            message: "Invalid ID format",
        });
    }
    if (populateFields) {
        const populatedDocument = await Model.findById(id).populate(populateFields);
        if (!populatedDocument) {
            return (0, response_1.errorResponse)(res, 404, "Document not found", {
                message: "Document not found",
            });
        }
        return populatedDocument;
    }
    const document = await Model.findById(id);
    if (!document) {
        return (0, response_1.errorResponse)(res, 404, "Document not found", {
            message: "Document not found",
        });
    }
    return document;
};
exports.checkIfDocumentExistsById = checkIfDocumentExistsById;
const getRandom = (howMuch) => {
    return (0, randomatic_1.default)("a0", howMuch || 18);
};
exports.getRandom = getRandom;
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
        console.log('error :', error);
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
