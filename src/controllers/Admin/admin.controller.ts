import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../../models/User";
import { checkIfUserExistsById } from "../../utils/util";
import { IUser } from "../../types/type";
import { logActivity } from "../../utils/activityLog";
import { sendEmail } from "../../services/mail.service";
import { errorResponse, successResponse } from "../../utils/response";

interface AuthRequest extends Request {
  user?: {
    _id: string;
    is_admin: boolean;
  };
}

export const getPendingUsers = async (_req: AuthRequest, res: Response) => {
  const users = await User.find({ status: "pending" });
  return res.status(200).json({ users });
};

export const approveUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params?.userId;
    const adminId = req.user?._id;

    const user = (await checkIfUserExistsById(userId, res)) as IUser;

    //   For the User
    const log = await logActivity({
      req,
      userId: `${user._id}`,
      action: "APPROVED",
      description: "Your account has been approved",
      metadata: {
        userId: user._id,
        adminId: adminId,
      },
    });
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        status: "approved",
        approved_at: new Date(),
        admin_notes: req.body.admin_notes || "No notes provided",
        approved_by: new mongoose.Types.ObjectId(adminId),
        logs: Array.isArray(user.logs) ? [...user.logs, log._id] : [log._id],
      },
      {
        new: true,
      }
    );
    sendEmail(
      user.email,
      "Account Approved",
      "Your account has been approved by the admin."
    );
    //   For the User

    //   For the Admin
    const adminLog = await logActivity({
      req,
      userId: `${adminId}`,
      action: "APPROVE_USER",
      description: "Approved user account",
      metadata: {
        userId: adminId,
        adminId: adminId,
      },
    });
    await User.findByIdAndUpdate(adminId, {
      $push: { logs: adminLog._id },
    });
    sendEmail(
        user.email,
        "Account Approved",
        "You just approved this account, The user has been notified."
      );
    return successResponse(res, 200, "User approved successfully", updatedUser);
  } catch (error) {
    return errorResponse(res, 500, "Error approving user", error);
  }
};

export const rejectUser = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { reason } = req.body;
  const adminId = req.user?._id;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.status = "rejected";
  user.rejectedAt = new Date();
  user.rejectedBy = new mongoose.Types.ObjectId(adminId);
  user.rejectionReason = reason || "Not specified";

  await user.save();

  return res.status(200).json({ message: "User rejected", user });
};
