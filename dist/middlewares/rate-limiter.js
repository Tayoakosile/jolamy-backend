"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = void 0;
// src/middleware/rateLimiter.ts
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 100, // 1 minutes
    max: 300, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    message: {
        status: 429,
        error: "Too many requests. Please try again later.",
    },
});
