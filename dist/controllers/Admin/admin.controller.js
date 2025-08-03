"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectUser = exports.approveUser = exports.getPendingUsers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../../models/User"));
const util_1 = require("../../utils/util");
const activityLog_1 = require("../../utils/activityLog");
const mail_service_1 = require("../../services/mail.service");
const response_1 = require("../../utils/response");
const getPendingUsers = async (_req, res) => {
    const users = await User_1.default.find({ status: "pending" });
    return res.status(200).json({ users });
};
exports.getPendingUsers = getPendingUsers;
const approveUser = async (req, res) => {
    try {
        const userId = req.params?.userId;
        const adminId = req.user?._id;
        const user = (await (0, util_1.checkIfUserExistsById)(userId, res));
        //   For the User
        const log = await (0, activityLog_1.logActivity)({
            req,
            userId: `${user._id}`,
            action: "APPROVED",
            description: "Your account has been approved",
            metadata: {
                userId: user._id,
                adminId: adminId,
            },
        });
        const updatedUser = await User_1.default.findByIdAndUpdate(user._id, {
            status: "approved",
            approved_at: new Date(),
            admin_notes: req.body.admin_notes || "No notes provided",
            approved_by: new mongoose_1.default.Types.ObjectId(adminId),
            logs: Array.isArray(user.logs) ? [...user.logs, log._id] : [log._id],
        }, {
            new: true,
        });
        (0, mail_service_1.sendEmail)(user.email, "Account Approved", "Your account has been approved by the admin.");
        //   For the User
        //   For the Admin
        const adminLog = await (0, activityLog_1.logActivity)({
            req,
            userId: `${adminId}`,
            action: "APPROVE_USER",
            description: "Approved user account",
            metadata: {
                userId: adminId,
                adminId: adminId,
            },
        });
        await User_1.default.findByIdAndUpdate(adminId, {
            $push: { logs: adminLog._id },
        });
        (0, mail_service_1.sendEmail)(user.email, "Account Approved", "You just approved this account, The user has been notified.");
        return (0, response_1.successResponse)(res, 200, "User approved successfully", updatedUser);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, 500, "Error approving user", error);
    }
};
exports.approveUser = approveUser;
const rejectUser = async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user?._id;
    const user = await User_1.default.findById(userId);
    if (!user)
        return res.status(404).json({ message: "User not found" });
    user.status = "rejected";
    user.rejectedAt = new Date();
    user.rejectedBy = new mongoose_1.default.Types.ObjectId(adminId);
    user.rejectionReason = reason || "Not specified";
    await user.save();
    return res.status(200).json({ message: "User rejected", user });
};
exports.rejectUser = rejectUser;
