import User from "../models/User";

import { Response } from "express";
import OfficeWorker from "../models/Admin/OfficeWorker";
import { IUser } from "../types/type";
import { errorResponse } from "../utils/response";

export const signupService = async (
  req: any,
  res: Response
): Promise<IUser> => {
  // TODO : Check if Email and Username is already registered
  const existingUser = await User.findOne({
    email: req.email,
    username: req?.username,
  });

  const existingOfficeWorker = await OfficeWorker.findOne({
    email: req.email,
    username: req?.username,
  });
  if (existingUser || existingOfficeWorker) {
    errorResponse(res, 400, "User with this email already exists");
  }

  const user = await User.create({
    ...req,
  });

  return user;
};
