"use strict";
// utils/checkIfExists.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandom = exports.checkIfUserExistsById = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const randomatic_1 = __importDefault(require("randomatic"));
const User_1 = __importDefault(require("../models/User"));
const response_1 = require("./response");
/**
 * Checks if a user exists by ID.
 * @param id - The MongoDB ObjectId as string.
 * @returns The user document if found, or null.
 * @throws Error if the ID is invalid or the DB fails.
 */
const checkIfUserExistsById = async (id, res) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        (0, response_1.errorResponse)(res, 400, "Invalid user ID format", {
            message: "Invalid user ID format",
        });
    }
    const user = await User_1.default.findById(id);
    if (!user) {
        (0, response_1.errorResponse)(res, 401, "User not found", {
            message: "User not found",
        });
    }
    return user;
};
exports.checkIfUserExistsById = checkIfUserExistsById;
const getRandom = (howMuch) => {
    return (0, randomatic_1.default)("a0", howMuch || 18);
};
exports.getRandom = getRandom;
