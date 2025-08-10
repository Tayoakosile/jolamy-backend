"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controllers_1 = require("../controllers/auth.controllers");
const verify_document_controllers_1 = require("../controllers/verify-document.controllers");
const auth_1 = require("../middlewares/auth");
const util_1 = require("../utils/util");
const authApiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 10,
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    message: {
        status: 429,
        error: "Too many requests. Please try again later.",
    },
});
const router = (0, express_1.Router)();
router.post("/signup", authApiLimiter, util_1.removeSensitiveFields, auth_controllers_1.createAccount);
router.post("/login", authApiLimiter, util_1.removeSensitiveFields, auth_controllers_1.loginAccount);
router.post("/forgot-password", authApiLimiter, util_1.removeSensitiveFields, auth_controllers_1.forgotPassword);
router.post("/reset-password/:token", authApiLimiter, util_1.removeSensitiveFields, auth_controllers_1.resetPassword);
router.post("/verify-documents", auth_1.appAuth, verify_document_controllers_1.verifyDocuments);
router.post("/verify-documents/:id", auth_1.appAuth, verify_document_controllers_1.verifyDocuments);
router.get("/verify-documents/:id", auth_1.appAuth, verify_document_controllers_1.getUserInfo);
router.get("/profile", auth_1.appAuth, auth_controllers_1.getUserProfile);
exports.default = router;
