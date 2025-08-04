import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import User from "../../models/User";
import { sendEmail } from "../../services/mail.service";
import { IUser } from "../../types/type";
import { logActivity } from "../../utils/activityLog";
import { errorResponse, successResponse } from "../../utils/response";
import { checkIfDocumentExistsById } from "../../utils/util";

interface AuthRequest extends Request {
  user?: {
    _id: string;
    is_admin: boolean;
    email: string;
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

    const user = (await checkIfDocumentExistsById<IUser>(
      userId,
      res,
      User
    )) as IUser;

    //   For the User
    const log = await logActivity({
      req,
      userId: new Types.ObjectId(user._id),
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
        admin_notes: req.body?.admin_notes || "No notes provided",
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
      userId: new Types.ObjectId(adminId),
      sender: new Types.ObjectId(adminId),
      receiver: new Types.ObjectId(user._id),
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
      req.user?.email as string,
      "Account Approved",
      "You just approved this account, The user has been notified."
    );
    return successResponse(res, 200, "User approved successfully", updatedUser);
  } catch (error) {
    console.log("error :", error);

    return errorResponse(res, 500, "Error approving user", error);
  }
};

export const rejectUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params?.userId;
    const adminId = req.user?._id;
    const user = (await checkIfDocumentExistsById<IUser>(
      userId,
      res,
      User
    )) as IUser;

    //   For the User
    const log = await logActivity({
      req,
      userId: new Types.ObjectId(user._id),
      sender: new Types.ObjectId(adminId),
      receiver: new Types.ObjectId(user._id),
      action: "REJECTED",
      description: "Your account has been rejected",
      metadata: {
        userId: user._id,
        adminId: adminId,
      },
    });
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        status: "rejected",
        rejected_at: new Date(),
        rejected_reason: req.body?.rejected_reason,
        rejected_by: new mongoose.Types.ObjectId(adminId),
        logs: Array.isArray(user.logs) ? [...user.logs, log._id] : [log._id],
      },
      {
        new: true,
      }
    );
    sendEmail(
      user.email,
      "Account Rejected",
      "Your account has been rejected by the admin."
    );
    //   For the User

    //   For the Admin
    const adminLog = await logActivity({
      req,
      userId: new Types.ObjectId(adminId),
      sender: new Types.ObjectId(adminId),
      receiver: new Types.ObjectId(user._id),
      action: "REJECT_USER",
      description: "Rejected user account",
      metadata: {
        userId: adminId,
        rejected_reason: req.body?.rejected_reason || "No notes provided",
      },
    });
    await User.findByIdAndUpdate(adminId, {
      $push: { logs: adminLog._id },
    });
    //   sendEmail(
    //     req.user?.email as string,
    //     "Account Rejected",
    //     "You just rejected this account, The user has been notified."
    //   );
    return successResponse(res, 200, "User rejected successfully", updatedUser);
  } catch (error) {
    return errorResponse(res, 500, "Error approving user", error);
  }
};
