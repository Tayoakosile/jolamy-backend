"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserInfo = exports.verifyDocuments = void 0;
const User_1 = __importDefault(require("../models/User"));
const mail_service_1 = require("../services/mail.service");
const activityLog_1 = require("../utils/activityLog");
const response_1 = require("../utils/response");
const util_1 = require("../utils/util");
const mongoose_1 = require("mongoose");
const verifyDocuments = async (req, res) => {
    const user_id = req.params.id;
    try {
        const user = (await (0, util_1.checkIfDocumentExistsById)(user_id, res, User_1.default));
        const userLog = await (0, activityLog_1.logActivity)({
            req,
            user_id: new mongoose_1.Types.ObjectId(user._id),
            action: "VERIFY_DOCUMENTS",
            description: "User submitted documents and referees for verification",
            metadata: {
                documents: user.documents,
                referees: user.referees,
            },
        });
        const updatedUser = (await User_1.default.findOneAndUpdate({ _id: user._id }, {
            ...req.body,
            logs: Array.isArray(user.logs)
                ? [...user.logs, userLog._id]
                : [userLog._id], // Ensure logs is an array before appending
        }, {
            new: true, // Return the updated document
        }));
        await (0, mail_service_1.sendEmail)(user.email, "Document Verification Request", "Documents and referees have been submitted for verification. We will notify you once the process is complete.");
        (0, response_1.successResponse)(res, 200, "Documents and Referees submitted successfully", updatedUser);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 401, "Error verifying documents");
    }
};
exports.verifyDocuments = verifyDocuments;
const getUserInfo = async (req, res) => {
    const user_id = req.params.id;
    const user = (await (0, util_1.checkIfDocumentExistsById)(user_id, res, User_1.default));
    (0, response_1.successResponse)(res, 200, "User information retrieved successfully", user);
};
exports.getUserInfo = getUserInfo;
