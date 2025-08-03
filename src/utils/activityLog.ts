import { Request } from "express";
import { ActivityLog } from "../models/ActivityLog";

// src/utils/logActivity.ts

export const logActivity = async ({
  req,
  userId,
  action,
  description,
  metadata,
}: {
  req: Request;
  userId: string;
  action: string;
  description?: string;
  metadata?: any;
}) => {
  const ip =
    ((req.headers["x-forwarded-for"] as string) || "").split(",")[0]?.trim() ||
    req.socket.remoteAddress;
  const location = (req.headers["x-location"] as string) || "Unknown Location";
  const log = await ActivityLog.create({
    userId,
    action,
    description,
    ip,
    device: req.headers["user-agent"],
    location,
    metadata,
  });
  return log;
};
