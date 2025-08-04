"use strict";
// src/middleware/auth.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWorker = exports.isAdmin = exports.appAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const response_1 = require("../utils/response");
const appAuth = async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }
    if (!token) {
        (0, response_1.errorResponse)(res, 401, "Not authorized, token missing", {
            message: "Not authorized, token missing",
        });
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.default.findById(decoded.id);
        if (!user) {
            (0, response_1.errorResponse)(res, 401, "User not found", { message: "User not found" });
            return next();
        }
        if (user.rejected_by ||
            user?.status === "disabled" ||
            user?.status === "rejected") {
            return (0, response_1.errorResponse)(res, 403, "User account is inactive", {
                message: "User account is inactive. Please contact support.",
                status: user.status,
            });
        }
        // Attach user to request object
        req.user = user;
        next();
    }
    catch (err) {
        (0, response_1.errorResponse)(res, 401, "Invalid or expired token", {
            message: "Invalid or expired token",
        });
        return next();
    }
};
exports.appAuth = appAuth;
// middleware/auth.ts
const isAdmin = (req, res, next) => {
    const user = req.user;
    if (user?.is_admin)
        return next();
    return (0, response_1.successResponse)(res, 403, "Access denied, admin only");
};
exports.isAdmin = isAdmin;
const isWorker = (req, res, next) => {
    const user = req.user;
    if (user?.worker || user?.factory_worker)
        return next();
    // if (user.is)
    return (0, response_1.successResponse)(res, 403, "Access denied, Workers only");
};
exports.isWorker = isWorker;
