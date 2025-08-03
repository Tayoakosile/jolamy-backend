"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAccount = exports.createAccount = void 0;
const auth_service_1 = require("../services/auth.service");
const mail_service_1 = require("../services/mail.service");
const response_1 = require("../utils/response");
const User_1 = __importDefault(require("../models/User"));
const jwt_1 = require("../utils/jwt");
const bcrypt_util_1 = require("../utils/bcrypt.util");
const ActivityLog_1 = require("../models/ActivityLog");
const createAccount = async (req, res) => {
    try {
        const user = await (0, auth_service_1.signupService)({
            ...req.body,
            status: "pending_for_documents",
            is_distributor: req.body.user_role === "distributor",
            is_admin: req.body.user_role === "admin",
            is_sales_agents: req.body.user_role === "sales_agent",
            is_worker: req.body.user_role === "worker",
        }, req.body.password);
        (0, mail_service_1.sendEmail)(req.body.email, "Welcome to Our Service", `Hello ${user.name}, welcome to our service!`);
        (0, response_1.successResponse)(res, 201, "User created successfully");
    }
    catch (error) {
        console.log("error here :", error);
        (0, response_1.errorResponse)(res, 400, error, error);
    }
};
exports.createAccount = createAccount;
const loginAccount = async (req, res) => {
    try {
        // return;
        if (!req.body || !req.body.email || !req.body.password) {
            (0, response_1.errorResponse)(res, 400, "Email and password are required");
        }
        const email = req.body?.email;
        const password = req.body?.password;
        const user = (await User_1.default.findOne({ email }));
        if (!user) {
            (0, response_1.errorResponse)(res, 404, "User not found with this email", {
                message: "User not found with this email",
            });
        }
        if (user.status === "disabled" || user.status === "rejected") {
            (0, response_1.errorResponse)(res, 403, "User account is inactive", {
                message: "User account is inactive. Please contact support.",
                status: user.status,
            });
        }
        const comparePassword = await (0, bcrypt_util_1.isMatch)(password, user.password);
        if (!comparePassword)
            (0, response_1.errorResponse)(res, 401, "invalid Email or Password");
        const token = (0, jwt_1.generateToken)(`${user._id}`);
        const activityLog = await ActivityLog_1.ActivityLog.create({
            userId: user._id,
            action: "LOGIN",
            description: "User logged in successfully",
            ip: req.ip,
            device: req.headers["user-agent"],
            location: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
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
        await (0, mail_service_1.sendEmail)("" + user.email, "Login Notification", "You have successfully logged in to your account.");
        (0, response_1.successResponse)(res, 200, "Login successful", {
            token,
            user: {
                id: user._id,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        (0, response_1.errorResponse)(res, 500, "An error occurred during login", error);
    }
};
exports.loginAccount = loginAccount;
