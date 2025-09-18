// src/middleware/auth.ts

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import OfficeWorker from "../models/Admin/OfficeWorker";
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
  // const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1]?.replace(/"/g, "");
  }
  if (!token) {
    errorResponse(res, 403, "Not authorized, token missing", {
      message: "Not authorized, token missing",
    });
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (!decoded || !decoded.id) {
      errorResponse(res, 401, "Invalid token", { message: "Invalid token" });
      return next();
    }
    const user = (await User.findOne({ user_id: decoded.id })) as IUser;
    if (user.token_version >= 1) {
      errorResponse(res, 401, "Invalid token", { message: "Invalid token" });
      return next();
    }

    const worker = (await OfficeWorker.findOne({
      worker_id: decoded.id,
    })) as IUser;
    (req as any).isWorker = Boolean(worker?.worker_id);
    (req as any).isUserAdmin = Boolean(user?.user_role == "admin");
    (req as any).isOtherUser = Boolean(
      user?.user_role !== "admin" && !worker?.worker_id
    );
    if (worker) {
      (req as any).worker = worker;
      next();
      return;
    }
    if (user) {
      if (
        user?.rejected_by ||
        user?.status === "inactive" ||
        user?.status === "disabled" ||
        user?.status === "rejected"
      ) {
        errorResponse(res, 403, "User account is inactive", {
          message: "User account is inactive. Please contact support.",
          status: user.status,
        });
        return;
      }
    }
    if (!user && !worker) {
      errorResponse(res, 401, "User not found", { message: "User not found" });
      return;
    }
    (req as any).user = worker ? worker : user;
    next();
    return;
  } catch (err) {
    errorResponse(res, 401, "Invalid or expired token", {
      message: "Invalid or expired token",
    });
    return;
  }
};
export const appAuthForInactiveUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1]?.replace(/"/g, "");
  }
  if (!token) {
    errorResponse(res, 403, "Not authorized, token missing", {
      message: "Not authorized, token missing",
    });
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (!decoded || !decoded.id) {
      errorResponse(res, 401, "Invalid token", { message: "Invalid token" });
      return next();
    }

    const user = (await User.findOne({ user_id: decoded.id })
      .populate("orders")
      .populate("transaction_history")
      .populate("change_request")
      .populate("bonus")) as IUser;

    const worker = (await OfficeWorker.findOne({
      worker_id: decoded.id,
    })) as IUser;
    if (user.token_version >= 1) {
      errorResponse(res, 401, "Invalid token", { message: "Invalid token" });
      return next();
    }

    (req as any).isWorker = Boolean(worker?.worker_id);
    (req as any).isUserAdmin = Boolean(user?.user_role == "admin");
    (req as any).isOtherUser = Boolean(
      user?.user_role !== "admin" && !worker?.worker_id
    );
    if (worker) {
      (req as any).worker = worker;
      next();
      return;
    }
    if (user) {
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
    }
    if (!user && !worker) {
      errorResponse(res, 401, "User not found", { message: "User not found" });
      return;
    }
    (req as any).user = worker ? worker : user;

    next();
    return;
  } catch (err) {
    errorResponse(res, 401, "Invalid or expired token", {
      message: "Invalid or expired token",
    });
    return;
  }
};

// middleware/auth.ts
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as IUser;

  if (user?.is_admin || user?.user_role == "admin") return next();
  errorResponse(res, 403, "Access denied, admin only");
  return;
};
export const isWorker = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).worker;
  if (user?.worker || user?.factory_worker || user) return next();
  errorResponse(res, 403, "Access denied, Workers only");
  return;
};
