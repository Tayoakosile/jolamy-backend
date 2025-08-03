// src/middleware/auth.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError";
import User from "../models/User";
import { error } from "console";
import { errorResponse } from "../utils/response";

interface JwtPayload {
  id: string;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    errorResponse(res, 401, "Not authorized, token missing", {
      message: "Not authorized, token missing",
    });
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const user = await User.findById(decoded.id);

    if (!user) {
      errorResponse(res, 401, "User not found", { message: "User not found" });
      return next();
    }

    // Attach user to request object
    (req as any).user = user;
    next();
  } catch (err) {
    errorResponse(res, 401, "Invalid or expired token", {
      message: "Invalid or expired token",
    });
    return next();
  }
};
