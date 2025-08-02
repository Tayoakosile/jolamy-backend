import User, { IUser } from "../models/User";

import bcrypt from "bcryptjs";

export const signupService = async (
  req: any,
  password: string
): Promise<IUser> => {
  const existingUser = await User.findOne({ email: req.email });
  if (existingUser) {
    throw new Error("Email already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    ...req,
    password: hashedPassword,
  });

  return user;
};
