"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (userId, secret) => {
    return jsonwebtoken_1.default.sign({ id: userId }, secret || process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};
exports.generateToken = generateToken;
const decodeToken = (userId, secret) => {
    return jsonwebtoken_1.default.verify(userId, secret || process.env.JWT_SECRET);
};
exports.decodeToken = decodeToken;
