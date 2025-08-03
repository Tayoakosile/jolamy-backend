"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAccount = exports.createAccount = void 0;
const auth_service_1 = require("../services/auth.service");
const mail_service_1 = require("../services/mail.service");
const response_1 = require("../utils/response");
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
const loginAccount = async (_, res) => {
    res.json("yooo");
};
exports.loginAccount = loginAccount;
