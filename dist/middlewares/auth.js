"use strict";
// src/middleware/auth.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWorker = exports.isAdmin = exports.appAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const OfficeWorker_1 = require("../models/Admin/OfficeWorker");
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
        const user = (await User_1.default.findById(decoded.id));
        const worker = (await OfficeWorker_1.OfficeWorker.findById(decoded.id));
        if (!user && !worker) {
            (0, response_1.errorResponse)(res, 401, "User not found", { message: "User not found" });
            return next();
        }
        if (worker) {
            req.user = worker;
            next();
            return;
        }
        if (user?.rejected_by ||
            user?.status === "disabled" ||
            user?.status === "rejected") {
            (0, response_1.errorResponse)(res, 403, "User account is inactive", {
                message: "User account is inactive. Please contact support.",
                status: user.status,
            });
            return;
        }
        req.user = worker ? worker : user;
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
    if (user?.is_admin || user.user_role == "admin")
        return next();
    (0, response_1.errorResponse)(res, 403, "Access denied, admin only");
    return;
};
exports.isAdmin = isAdmin;
const isWorker = (req, res, next) => {
    const user = req.user;
    if (user?.worker || user?.factory_worker || user)
        return next();
    (0, response_1.errorResponse)(res, 403, "Access denied, Workers only");
    return;
};
exports.isWorker = isWorker;
