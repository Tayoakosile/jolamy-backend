"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMatch = exports.encrypt = void 0;
// src/utils/bcrypt.util.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const SALT_ROUNDS = 5;
/**
 * Hash a string (e.g. password)
 * @param rawText - plain text to hash
 * @returns hashed string
 */
const encrypt = async (rawText) => {
    const salt = await bcryptjs_1.default.genSalt(SALT_ROUNDS);
    const hashed = await bcryptjs_1.default.hash(rawText, salt);
    return hashed;
};
exports.encrypt = encrypt;
/**
 * Compare a raw string with its hashed value
 * @param rawText - plain text input
 * @param hashedText - hashed version
 * @returns true if they match, false otherwise
 */
const isMatch = async (rawText, hashedText) => {
    return await bcryptjs_1.default.compare(rawText, hashedText);
};
exports.isMatch = isMatch;
