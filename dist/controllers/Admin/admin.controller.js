"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectUser = exports.approveUser = exports.getPendingUsers = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const User_1 = __importDefault(require("../../models/User"));
const mail_service_1 = require("../../services/mail.service");
const activityLog_1 = require("../../utils/activityLog");
const response_1 = require("../../utils/response");
const util_1 = require("../../utils/util");
const getPendingUsers = async (_req, res) => {
    const users = await User_1.default.find({ status: "pending" });
    return res.status(200).json({ users });
};
exports.getPendingUsers = getPendingUsers;
const approveUser = async (req, res) => {
    try {
        const userId = req.params?.userId;
        const adminId = req.user?._id;
        const user = (await (0, util_1.checkIfDocumentExistsById)(userId, res, User_1.default));
        //   For the User
        const log = await (0, activityLog_1.logActivity)({
            req,
            userId: new mongoose_1.Types.ObjectId(user._id),
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
            admin_notes: req.body?.admin_notes || "No notes provided",
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
            userId: new mongoose_1.Types.ObjectId(adminId),
            sender: new mongoose_1.Types.ObjectId(adminId),
            receiver: new mongoose_1.Types.ObjectId(user._id),
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
        (0, mail_service_1.sendEmail)(req.user?.email, "Account Approved", "You just approved this account, The user has been notified.");
        return (0, response_1.successResponse)(res, 200, "User approved successfully", updatedUser);
    }
    catch (error) {
        console.log("error :", error);
        return (0, response_1.errorResponse)(res, 500, "Error approving user", error);
    }
};
exports.approveUser = approveUser;
const rejectUser = async (req, res) => {
    try {
        const userId = req.params?.userId;
        const adminId = req.user?._id;
        const user = (await (0, util_1.checkIfDocumentExistsById)(userId, res, User_1.default));
        //   For the User
        const log = await (0, activityLog_1.logActivity)({
            req,
            userId: new mongoose_1.Types.ObjectId(user._id),
            sender: new mongoose_1.Types.ObjectId(adminId),
            receiver: new mongoose_1.Types.ObjectId(user._id),
            action: "REJECTED",
            description: "Your account has been rejected",
            metadata: {
                userId: user._id,
                adminId: adminId,
            },
        });
        const updatedUser = await User_1.default.findByIdAndUpdate(user._id, {
            status: "rejected",
            rejected_at: new Date(),
            rejected_reason: req.body?.rejected_reason,
            rejected_by: new mongoose_1.default.Types.ObjectId(adminId),
            logs: Array.isArray(user.logs) ? [...user.logs, log._id] : [log._id],
        }, {
            new: true,
        });
        (0, mail_service_1.sendEmail)(user.email, "Account Rejected", "Your account has been rejected by the admin.");
        //   For the User
        //   For the Admin
        const adminLog = await (0, activityLog_1.logActivity)({
            req,
            userId: new mongoose_1.Types.ObjectId(adminId),
            sender: new mongoose_1.Types.ObjectId(adminId),
            receiver: new mongoose_1.Types.ObjectId(user._id),
            action: "REJECT_USER",
            description: "Rejected user account",
            metadata: {
                userId: adminId,
                rejected_reason: req.body?.rejected_reason || "No notes provided",
            },
        });
        await User_1.default.findByIdAndUpdate(adminId, {
            $push: { logs: adminLog._id },
        });
        //   sendEmail(
        //     req.user?.email as string,
        //     "Account Rejected",
        //     "You just rejected this account, The user has been notified."
        //   );
        return (0, response_1.successResponse)(res, 200, "User rejected successfully", updatedUser);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, 500, "Error approving user", error);
    }
};
exports.rejectUser = rejectUser;
