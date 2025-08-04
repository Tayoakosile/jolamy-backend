// src/middleware/auth.ts

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OfficeWorker } from "../models/Admin/OfficeWorker";
import User from "../models/User";
import { IUser } from "../types/type";
import { errorResponse } from "../utils/response";

interface JwtPayload {
  id: string;
}

export const appAuth = async (
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

    const user = (await User.findById(decoded.id)) as IUser;
    const worker = (await OfficeWorker.findById(decoded.id)) as IUser;

    if (!user && !worker) {
      errorResponse(res, 401, "User not found", { message: "User not found" });
      return next();
    }
    if (worker) {
      (req as any).user = worker ? worker : user;
      next();
    }
    if (
      user?.rejected_by ||
      user?.status === "disabled" ||
      user?.status === "rejected"
    ) {
      errorResponse(res, 403, "User account is inactive", {
        message: "User account is inactive. Please contact support.",
        status: user.status,
      });
      return;
    }

    (req as any).user = worker ? worker : user;
    next();
  } catch (err) {
    errorResponse(res, 401, "Invalid or expired token", {
      message: "Invalid or expired token",
    });
    return next();
  }
};

// middleware/auth.ts
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as IUser;
  if (user?.is_admin || user.user_role == "admin") return next();
  errorResponse(res, 403, "Access denied, admin only");
  return;
};
export const isWorker = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user?.worker || user?.factory_worker) return next();

  errorResponse(res, 403, "Access denied, Workers only");
  return;
};
