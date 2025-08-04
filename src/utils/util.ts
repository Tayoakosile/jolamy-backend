// utils/checkIfExists.ts

import mongoose from "mongoose";
import randomatic from "randomatic";
import User from "../models/User";
import { errorResponse, successResponse } from "./response";
import { Request, Response } from "express";
import { sendEmail } from "../services/mail.service";

/**
 * Checks if a user exists by ID.
 * @param id - The MongoDB ObjectId as string.
 * @returns The user document if found, or null.
 * @throws Error if the ID is invalid or the DB fails.
 */
export const checkIfUserExistsById = async (id: string, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    errorResponse(res, 400, "Invalid user ID format", {
      message: "Invalid user ID format",
    });
  }

  const user = await User.findById(id)!;
  if (!user) {
    errorResponse(res, 401, "User not found", {
      message: "User not found",
    });
  }

  return user;
};

export const getRandom = (howMuch?: number) => {
  return randomatic("a0", howMuch || 18);
};

export const customReqResHandler = async (
  req: Request,
  res: Response,
  reqFunction: () => void,
//   errorFunction?: (error: any) => void,
  statusCode?: number,
  statusErrorCode?: number,
  success: {
    message: string;
    data?: any;
  } = {
    message: "Operation successful",
    data: null,
  },
  errorInCode: {
    message: string;
    data?: any;
  } = {
    message: "An error occurred",
    data: null,
  },
  shouldSendMail?: boolean,
  mailTo?: string,
  title?: string,
  message?: string
) => {
  try {
    const response = await reqFunction();

    if (shouldSendMail) {
      await sendEmail(mailTo as string, title as string, message as string);
    }
    return successResponse(
      res,
      statusCode || 200,
      success?.message,
      success.data || response
    );
  } catch (error) {
    // errorFunction(error);
    errorResponse(
      res,
      statusErrorCode || 500,
      errorInCode.message,
      errorInCode.data
    );
  }
};
