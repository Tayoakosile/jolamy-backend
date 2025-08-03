"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDocuments = void 0;
const User_1 = __importDefault(require("../models/User"));
const response_1 = require("../utils/response");
const mongoose_1 = require("mongoose");
const verifyDocuments = async (req, res) => {
    const userId = req.params.id;
    try {
        if (userId) {
            if (!mongoose_1.Types.ObjectId.isValid(userId))
                (0, response_1.errorResponse)(res, 400, "Invalid user ID format", {
                    message: "Invalid user ID format",
                });
            const user = await User_1.default.findOne({ _id: userId });
            if (!user)
                (0, response_1.errorResponse)(res, 404, "User not found", {
                    message: "User not found",
                });
        }
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 404, "User not found", { message: "User not found" });
    }
};
exports.verifyDocuments = verifyDocuments;
// This function is a placeholder for the actual document verification logic.
