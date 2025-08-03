// utils/checkIfExists.ts

import mongoose from "mongoose";
import User from "../models/User";
import { errorResponse } from "./response";
import { Response } from "express";

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

    errorResponse(res, 404, "User not found", {
      message: "User not found",
    });
  }

  return user;
};
