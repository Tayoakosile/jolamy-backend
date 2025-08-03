import User from "../models/User";


import bcrypt from "bcryptjs";
import { AppError } from "../utils/appError";
import { IUser } from "../types/type";

export const signupService = async (
  req: any,
  password: string
): Promise<IUser> => {
  const existingUser = await User.findOne({ email: req.email });
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    ...req,
    password: hashedPassword,
  });

  return user;
};
