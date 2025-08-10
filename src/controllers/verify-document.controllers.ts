import { Request, Response } from "express";
import User from "../models/User";
import { sendEmail } from "../services/mail.service";
import { logActivity } from "../utils/activityLog";
import { errorResponse, successResponse } from "../utils/response";
import { checkIfDocumentExistsById } from "../utils/util";
import { IUser } from "../types/type";
import { Types } from "mongoose";

export const verifyDocuments = async (req: Request, res: Response) => {
  const user_id = req.params.id;

  try {
    const user = (await checkIfDocumentExistsById(
      user_id,
      "user_id",
      res,
      User
    )) as IUser;

    const userLog = await logActivity({
      req,
      user_id: new Types.ObjectId(user._id),
      action: "VERIFY_DOCUMENTS",
      description: "User submitted documents and referees for verification",
      metadata: {
        documents: user.documents as IUser["documents"],
        referees: user.referees,
      },
    });

    const updatedUser = (await User.findOneAndUpdate(
      { _id: user._id },
      {
        ...req.body,
        logs: Array.isArray(user.logs)
          ? [...user.logs, userLog._id]
          : [userLog._id], // Ensure logs is an array before appending
      },
      {
        new: true, // Return the updated document
      }
    )) as IUser;

    await sendEmail(
      user.email,
      "Document Verification Request",
      "Documents and referees have been submitted for verification. We will notify you once the process is complete."
    );
    successResponse(
      res,
      200,
      "Documents and Referees submitted successfully",
      updatedUser
    );
  } catch (error) {
    errorResponse(res, 401, "Error verifying documents");
  }
};

export const getUserInfo = async (req: Request, res: Response) => {
  const user_id = req.params.id;
  const user = (await checkIfDocumentExistsById(
    user_id,
    "user_id",
    res,
    User
  )) as IUser;
  successResponse(res, 200, "User information retrieved successfully", user);
};
