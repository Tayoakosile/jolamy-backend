"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.resetPassword = exports.forgotPassword = exports.verifySignUpDetails = exports.sendVerificationOtpToMail = exports.loginAccount = exports.updateAccountOnSignUp = exports.createAccount = void 0;
const User_1 = __importDefault(require("../models/User"));
const OfficeWorker_1 = __importDefault(require("../models/Admin/OfficeWorker"));
const auth_service_1 = require("../services/auth.service");
const mail_service_1 = require("../services/mail.service");
const activityLog_1 = require("../utils/activityLog");
const bcrypt_util_1 = require("../utils/bcrypt.util");
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const util_1 = require("../utils/util");
const trend_util_1 = require("../utils/trend.util");
const Order_1 = __importDefault(require("../models/Order"));
const Otp_1 = __importDefault(require("../models/Otp"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
const mongoose_1 = require("mongoose");
const createAccount = async (req, res, next) => {
    if (!req.body) {
        (0, response_1.errorResponse)(res, 400, "Request body is required");
        return;
    }
    if (req.body.user_role === "admin") {
        (0, response_1.errorResponse)(res, 400, "Admin role cannot be created via this endpoint");
        return;
    }
    if (!req.body.email || !req.body.password) {
        (0, response_1.errorResponse)(res, 400, "Email and password are required");
        return;
    }
    try {
        const user = await (0, auth_service_1.signupService)({
            ...req.body,
            status: "inactive",
            is_distributor: req.body.user_role === "distributor",
            is_sales_agents: req.body.user_role === "sales_agent",
            is_worker: req.body.user_role === "worker",
        }, res);
        (0, mail_service_1.sendEmail)(req.body.email, "Welcome to Our Service", `Hello ${user.username}, welcome to our service!`);
        await (0, exports.sendVerificationOtpToMail)(req, res, next, user.email);
        (0, response_1.successResponse)(res, 201, "User created successfully", {
            user: {
                id: user.user_id,
                email: user.email,
                is_verified: user.is_verified,
            },
        });
        return {
            is_verified: user.is_verified,
        };
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 400, error, error);
    }
};
exports.createAccount = createAccount;
const updateAccountOnSignUp = async (req, res) => {
    const user = req.user;
    try {
        if (req?.body?.payment_reference) {
            const paymentReference = (await (0, util_1.paystackVerification)(req?.body?.payment_reference)).data;
            if (paymentReference?.data?.status === "success") {
                const transaction = await Transaction_1.default.create({
                    user_id: user._id,
                    user_role: user?.user_role || "distributor",
                    amount: paymentReference.amount / 100, // convert to Naira
                    reference: paymentReference.reference,
                    status: "completed",
                    category: "registration_fee",
                    transaction_type: "credit",
                    payment_gateway: "paystack",
                    metadata: paymentReference,
                    total: paymentReference?.data.amount / 100,
                });
                const log = await (0, activityLog_1.logActivity)({
                    req,
                    action: "REGISTRATION_FEE_PAID",
                    description: "User paid registration fee successfully",
                    user_id: new mongoose_1.Types.ObjectId(user._id),
                    sender: new mongoose_1.Types.ObjectId(user._id),
                    receiver: new mongoose_1.Types.ObjectId(),
                    metadata: {
                        email: user.email,
                        user_id: new mongoose_1.Types.ObjectId(user._id),
                        amount: paymentReference.amount / 100,
                        reference: paymentReference.reference,
                    },
                });
                await User_1.default.findOneAndUpdate({ email: user?.email }, {
                    status: "submitted_for_review",
                    paid_registration_fee: true,
                    $push: {
                        logs: log._id,
                        transaction_history: transaction._id,
                    },
                });
                (0, response_1.successResponse)(res, 200, "Payment verified and account updated");
                return;
            }
        }
        await User_1.default.findOneAndUpdate({ email: user?.email }, {
            ...req.body,
            status: req?.body?.files
                ? "awaiting_registration_fee_payment"
                : Object.keys(req?.body?.address ?? {}).length > 0
                    ? "pending_for_documents"
                    : user.status,
            //
        });
        (0, response_1.successResponse)(res, 200, "Account Updated Successfully");
    }
    catch (error) {
        console.log("error :", error);
        (0, response_1.errorResponse)(res, 400, "Error updating account", error);
    }
};
exports.updateAccountOnSignUp = updateAccountOnSignUp;
const loginAccount = async (req, res, next) => {
    try {
        const email = req.body?.username?.toLowerCase() || req.body?.email?.toLowerCase();
        const password = req.body?.password;
        if (!req.body || !email || !req.body.password) {
            (0, response_1.errorResponse)(res, 400, "Email and password are required");
            return;
        }
        // search username or email fields
        const officeWorker = (await OfficeWorker_1.default.findOne({
            $or: [{ email }, { username: email }],
        }));
        if (officeWorker) {
            const comparePassword = await (0, bcrypt_util_1.isMatch)(password, officeWorker.password);
            if (!comparePassword) {
                (0, response_1.errorResponse)(res, 400, "invalid Email or Password");
                return;
            }
            const token = (0, jwt_1.generateToken)(`${officeWorker?.worker_id}`);
            const activityLog = await (0, activityLog_1.logActivity)({
                req,
                user_id: officeWorker.id,
                sender: officeWorker.id,
                receiver: officeWorker.id,
                action: "LOGIN",
                description: "Worker logged in successfully",
                metadata: {
                    email: officeWorker.email,
                    user_id: officeWorker.id,
                    role: officeWorker.role,
                },
            });
            await OfficeWorker_1.default.findOneAndUpdate({ worker_id: officeWorker }, {
                last_login: new Date(),
                is_first_login: officeWorker.last_login ? false : true,
                $push: { logs: activityLog._id },
            });
            await (0, mail_service_1.sendEmail)(officeWorker.email, "Login Notification", "You have successfully logged in to your account."
            // officeWorker.is_first_login
            //   ? "You have successfully logged in to your account for the first time. Welcome aboard!"
            //   : "You have successfully logged in to your account."
            );
            (0, response_1.successResponse)(res, 200, "Login successful", {
                token,
                user: {
                    id: officeWorker.worker_id,
                    email: officeWorker.email,
                    role: officeWorker.role,
                },
            });
            return;
        }
        const user = (await User_1.default.findOne({
            $or: [{ email }, { username: email }],
        }));
        if (!user) {
            (0, response_1.errorResponse)(res, 400, "User not found with this email", {
                message: "User not found with this email",
            });
            return;
        }
        const error = {
            is_verified: user.is_verified,
            email: user.email,
            user_id: user.user_id,
        };
        if (!user?.is_admin && !user.is_verified) {
            await (0, exports.sendVerificationOtpToMail)(req, res, next, user?.email);
            (0, response_1.errorResponse)(res, 400, "Email not verified", {
                message: "Please verify your email before logging in.",
                error,
            });
            return;
        }
        if (user.status === "disabled" ||
            user.status === "rejected" ||
            user.rejected_by) {
            (0, response_1.errorResponse)(res, 403, "User account is inactive", {
                message: "User account is inactive. Please contact support.",
                status: user.status,
                user,
            });
            return;
        }
        const comparePassword = await (0, bcrypt_util_1.isMatch)(password, user.password);
        if (!comparePassword) {
            (0, response_1.errorResponse)(res, 400, "invalid Email or Password");
            return;
        }
        const token = (0, jwt_1.generateToken)(user.user_id);
        const activityLog = await (0, activityLog_1.logActivity)({
            req,
            user_id: user._id,
            sender: user._id,
            receiver: user._id,
            action: "LOGIN",
            description: "User logged in successfully",
            metadata: {
                email: user.email,
                user_id: user._id,
                role: user.user_role,
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
                id: user.user_id,
                email: user.email,
                role: user.user_role,
            },
        });
    }
    catch (error) {
        console.log("error :", error);
        (0, response_1.errorResponse)(res, 500, "An error occurred during login", error);
    }
};
exports.loginAccount = loginAccount;
const sendVerificationOtpToMail = async (_req, res, next, userEmail) => {
    const req = _req;
    const email = req.body?.email || userEmail;
    try {
        if (!email) {
            (0, response_1.errorResponse)(res, 400, "Email is required");
            return;
        }
        const user = await User_1.default?.findOne({
            email,
        });
        if (!user) {
            (0, response_1.errorResponse)(res, 404, "User not found");
            return;
        }
        if (user.is_verified) {
            (0, response_1.errorResponse)(res, 400, "User is already verified");
            return;
        }
        const otp = (0, util_1.generateRandom)(6, "0");
        const otpRecord = await Otp_1.default.findOne({
            email,
            code: otp,
            type: "email_verification",
            expires_at: { $gt: new Date() },
        });
        if (otpRecord) {
            await (0, mail_service_1.sendEmail)(email, "Email Verification OTP", `Your OTP for email verification is: ${otp}. It will expire in 10 minutes.`);
            return otp;
        }
        await Otp_1.default.create({
            email,
            code: otp,
            type: "email_verification",
            expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
        });
        await (0, mail_service_1.sendEmail)(email, "Email Verification OTP", `Your OTP for email verification is: ${otp}. It will expire in 10 minutes.`);
        if (req.body?.show_success) {
            (0, response_1.successResponse)(res, 200, "OTP sent successfully");
        }
        return otp;
    }
    catch (error) {
        console.log("error :", error);
        (0, response_1.errorResponse)(res, 500, "An error occurred while sending verification OTP", error);
    }
};
exports.sendVerificationOtpToMail = sendVerificationOtpToMail;
const verifySignUpDetails = async (req, res) => {
    try {
        if (!req.body || !req.body.email || !req.body.otp) {
            (0, response_1.errorResponse)(res, 400, "Email and OTP are required");
            return;
        }
        const { email, otp } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            (0, response_1.errorResponse)(res, 404, "User not found");
            return;
        }
        if (user.is_verified) {
            (0, response_1.errorResponse)(res, 400, "User is already verified");
            return;
        }
        const otpRecord = await Otp_1.default.findOne({
            email,
            code: otp,
            type: "email_verification",
            expires_at: { $gt: new Date() },
        });
        if (!otpRecord) {
            (0, response_1.errorResponse)(res, 400, "Invalid or expired OTP");
            return;
        }
        const activityLog = await (0, activityLog_1.logActivity)({
            req,
            user_id: user._id,
            sender: user._id,
            receiver: user._id,
            action: "EMAIL_VERIFIED",
            description: "User email verified successfully",
            metadata: {
                email: user.email,
                user_id: user._id,
            },
        });
        await User_1.default.findByIdAndUpdate(user._id, {
            is_verified: true,
            $push: { logs: activityLog._id },
        });
        await Otp_1.default.deleteMany({ email, type: "email_verification" });
        await (0, mail_service_1.sendEmail)(user.email, "Email Verified Successfully", "Your email has been verified successfully.");
        (0, response_1.successResponse)(res, 200, "Email verified successfully");
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 500, "An error occurred during email verification", error);
    }
};
exports.verifySignUpDetails = verifySignUpDetails;
const forgotPassword = async (req, res) => {
    try {
        if (!req.body || !req.body.email)
            (0, response_1.errorResponse)(res, 400, "Email is required");
        const { email } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            (0, response_1.errorResponse)(res, 401, "No user found with that email");
            return;
        }
        // Generate reset token
        const resetToken = (0, util_1.generateRandom)();
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
        const token = req.params?.token;
        const password = req.body?.password;
        // Debugging information removed for production
        const user = await User_1.default.findOne({
            forgot_password_token: token,
            forgot_password_expires: { $gt: new Date() },
        });
        if (!user) {
            (0, response_1.errorResponse)(res, 400, "Invalid or expired reset token");
            return;
        }
        const activityLog = await (0, activityLog_1.logActivity)({
            req,
            user_id: user.user_id,
            sender: user.user_id,
            receiver: user.user_id,
            action: "PASSWORD_RESET",
            description: "User password reset successfully",
            metadata: {
                email: user.email,
                user_id: user.user_id,
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
        (0, response_1.errorResponse)(res, 500, "An error occurred while resetting the password", error);
        return;
    }
};
exports.resetPassword = resetPassword;
const getUserProfile = async (_req, res) => {
    try {
        const req = _req;
        const userId = req.user?._id || req.worker?._id;
        const user = await User_1.default.findById(userId)
            .select("-password -__v ")
            .populate("orders")
            .populate("transaction_history")
            .populate("change_request")
            .populate("bonus");
        const worker = await OfficeWorker_1.default.findById(userId).select("-password -__v -_id");
        if (!user && !worker) {
            (0, response_1.errorResponse)(res, 400, "User not found ");
            return;
        }
        const totalBoxesInStock = await (0, trend_util_1.getTrend)(Order_1.default, {
            period: "week",
            filter: {
                user_id: user ? user._id : worker ? worker._id : null,
                status: "delivered",
            },
        });
        const totalPendingOrders = await (0, trend_util_1.getTrend)(Order_1.default, {
            period: "week",
            filter: {
                user_id: user ? user._id : worker ? worker._id : null,
                status: "pending",
            },
        });
        if (user?.is_distributor) {
            totalBoxesInStock;
            (0, response_1.successResponse)(res, 200, `${user ? "User's" : "Worker's"} profile retrieved successfully`, {
                ...user.toObject(),
                stats: [
                    {
                        title: "Total Boxes in Stock",
                        ...totalBoxesInStock,
                    },
                    {
                        title: "Outstanding Boxes Not Paid",
                        currentTotal: user?.outstanding_boxes,
                        previousTotal: 0,
                        percentageChange: 0,
                        trend: "no-change",
                    },
                    {
                        title: "Total Earnings",
                        currentTotal: 0,
                        previousTotal: 0,
                        percentageChange: 0,
                        trend: "no-change",
                        type: "currency",
                    },
                    {
                        title: "Total Bonus This Week",
                        currentTotal: 0,
                        previousTotal: 0,
                        percentageChange: 0,
                        trend: "no-change",
                        type: "currency",
                    },
                    {
                        title: "Pending Orders",
                        ...totalPendingOrders,
                    },
                ],
            });
            return;
        }
        (0, response_1.successResponse)(res, 200, `${user ? "User's" : "Worker's"} profile retrieved successfully`, user || worker);
        return;
    }
    catch (error) {
        console.log("error :", error);
        (0, response_1.errorResponse)(res, 500, "An error occurred while retrieving profile", error);
    }
};
exports.getUserProfile = getUserProfile;
