import User from "../models/User";

import bcrypt from "bcryptjs";
import { AppError } from "../utils/appError";
import { IUser } from "../types/type";
import { OfficeWorker } from "../models/Admin/OfficeWorker";
import { errorResponse } from "../utils/response";
import { Response } from "express";

export const signupService = async (
  req: any,
  res: Response
): Promise<IUser> => {
  const existingUser = await User.findOne({ email: req.email });
  const existingOfficeWorker = await OfficeWorker.findOne({ email: req.email });
  if (existingUser || existingOfficeWorker) {
    errorResponse(res, 400, "User with this email already exists");
  }

  const user = await User.create({
    ...req,
  });

  return user;
};
