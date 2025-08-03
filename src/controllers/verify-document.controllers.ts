import { Request, Response } from "express";
import User from "../models/User";
import { errorResponse } from "../utils/response";
import { Types } from "mongoose";

export const verifyDocuments = async (req: Request, res: Response) => {
  const userId = req.params.id;
  try {
    if (userId) {
      if (!Types.ObjectId.isValid(userId))
        errorResponse(res, 400, "Invalid user ID format", {
          message: "Invalid user ID format",
        });

      const user = await User.findOne({ _id: userId });

      if (!user)
        errorResponse(res, 404, "User not found", {
          message: "User not found",
        });




    }
  } catch (error) {
    errorResponse(res, 404, "User not found", { message: "User not found" });
  }
};
// This function is a placeholder for the actual document verification logic.
