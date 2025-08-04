"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.loginAccount = exports.createAccount = void 0;
const User_1 = __importDefault(require("../models/User"));
const auth_service_1 = require("../services/auth.service");
const mail_service_1 = require("../services/mail.service");
const bcrypt_util_1 = require("../utils/bcrypt.util");
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const util_1 = require("../utils/util");
const activityLog_1 = require("../utils/activityLog");
const mongoose_1 = require("mongoose");
const OfficeWorker_1 = require("../models/Admin/OfficeWorker");
const createAccount = async (req, res) => {
    try {
        const user = await (0, auth_service_1.signupService)({
            ...req.body,
            status: "pending_for_documents",
            is_distributor: req.body.user_role === "distributor",
            is_admin: req.body.user_role === "admin",
            is_sales_agents: req.body.user_role === "sales_agent",
            is_worker: req.body.user_role === "worker",
        }, res);
        (0, mail_service_1.sendEmail)(req.body.email, "Welcome to Our Service", `Hello ${user.name}, welcome to our service!`);
        (0, response_1.successResponse)(res, 201, "User created successfully");
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 400, error, error);
    }
};
exports.createAccount = createAccount;
const loginAccount = async (req, res) => {
    try {
        if (!req.body || !req.body.email || !req.body.password) {
            (0, response_1.errorResponse)(res, 400, "Email and password are required");
        }
        const email = req.body?.email;
        const password = req.body?.password;
        const officeWorker = (await OfficeWorker_1.OfficeWorker.findOne({ email }));
        if (officeWorker) {
            const comparePassword = await (0, bcrypt_util_1.isMatch)(password, officeWorker.password);
            if (!comparePassword)
                (0, response_1.errorResponse)(res, 401, "invalid Email or Password");
            const token = (0, jwt_1.generateToken)(`${officeWorker._id}`);
            const activityLog = await (0, activityLog_1.logActivity)({
                req,
                userId: new mongoose_1.Types.ObjectId(officeWorker._id),
                sender: new mongoose_1.Types.ObjectId(officeWorker._id),
                receiver: new mongoose_1.Types.ObjectId(officeWorker._id),
                action: "LOGIN",
                description: "Worker logged in successfully",
                metadata: {
                    email: officeWorker.email,
                    userId: officeWorker._id,
                },
            });
            await OfficeWorker_1.OfficeWorker.findByIdAndUpdate(officeWorker._id, {
                last_login: new Date(),
                is_first_login: officeWorker.last_login ? false : true,
                $push: { logs: activityLog._id },
            });
            await (0, mail_service_1.sendEmail)(officeWorker.email, "Login Notification", officeWorker.is_first_login
                ? "You have successfully logged in to your account for the first time. Welcome aboard!"
                : "You have successfully logged in to your account.");
            (0, response_1.successResponse)(res, 200, "Login successful", {
                token,
                user: {
                    id: officeWorker._id,
                    email: officeWorker.email,
                },
            });
            return;
        }
        const user = (await User_1.default.findOne({ email }));
        if (!user) {
            (0, response_1.errorResponse)(res, 404, "User not found with this email", {
                message: "User not found with this email",
            });
        }
        if (user.status === "disabled" ||
            user.status === "rejected" ||
            user.rejected_by) {
            (0, response_1.errorResponse)(res, 403, "User account is inactive", {
                message: "User account is inactive. Please contact support.",
                status: user.status,
                user,
            });
        }
        const comparePassword = await (0, bcrypt_util_1.isMatch)(password, user.password);
        if (!comparePassword)
            (0, response_1.errorResponse)(res, 401, "invalid Email or Password");
        const token = (0, jwt_1.generateToken)(`${user._id}`);
        const activityLog = await (0, activityLog_1.logActivity)({
            req,
            userId: new mongoose_1.Types.ObjectId(user._id),
            sender: new mongoose_1.Types.ObjectId(user._id),
            receiver: new mongoose_1.Types.ObjectId(user._id),
            action: "LOGIN",
            description: "User logged in successfully",
            metadata: {
                email: user.email,
                userId: user._id,
            },
        });
        await User_1.default.findByIdAndUpdate(user._id, {
            last_login: new Date(),
            is_first_login: user.last_login ? false : true,
            $push: { logs: activityLog._id },
        });
        await (0, mail_service_1.sendEmail)(user.email, "Login Notification", "You have successfully logged in to your account.");
        (0, response_1.successResponse)(res, 200, "Login successful", {
            token,
            user: {
                id: user._id,
                email: user.email,
            },
        });
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 500, "An error occurred during login", error);
    }
};
exports.loginAccount = loginAccount;
const forgotPassword = async (req, res) => {
    try {
        if (!req.body || !req.body.email)
            (0, response_1.errorResponse)(res, 400, "Email is required");
        const { email } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return (0, response_1.errorResponse)(res, 401, "No user found with that email");
        }
        // Generate reset token
        const resetToken = (0, util_1.getRandom)();
        user.forgot_password_token = resetToken;
        user.forgot_password_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        await user.save();
        const resetURL = `https://your-frontend.com/reset-password/${resetToken}`;
        await (0, mail_service_1.sendEmail)(user.email, "Password Reset Request", "To reset your password, please click the link below:\n\n" + resetURL);
        (0, response_1.successResponse)(res, 200, "Reset link sent to your email");
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 500, "An error occurred while processing your request", error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        // Debugging information removed for production
        const user = await User_1.default.findOne({
            forgot_password_token: token,
            forgot_password_expires: { $gt: new Date() },
        });
        if (!user) {
            return (0, response_1.errorResponse)(res, 400, "Invalid or expired reset token");
        }
        const activityLog = await (0, activityLog_1.logActivity)({
            req,
            userId: new mongoose_1.Types.ObjectId(user._id),
            sender: new mongoose_1.Types.ObjectId(user._id),
            receiver: new mongoose_1.Types.ObjectId(user._id),
            action: "PASSWORD_RESET",
            description: "User password reset successfully",
            metadata: {
                email: user.email,
                userId: user._id,
            },
        });
        await User_1.default.findOneAndUpdate({ _id: user._id }, {
            forgot_password_expires: "",
            forgot_password_token: "",
            password,
            $push: { logs: activityLog._id },
        });
        await (0, mail_service_1.sendEmail)("" + user.email, "Password Reset Confirmation", "Your password has been reset successfully.");
        (0, response_1.successResponse)(res, 200, "Password has been reset successfully");
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, 500, "An error occurred while resetting the password", error);
    }
};
exports.resetPassword = resetPassword;
