import { Request } from "express";
import { ActivityLog } from "../models/ActivityLog";
import { Types } from "mongoose";

// src/utils/logActivity.ts

export const logActivity = async ({
  req,
  user_id,
  action,
  description,
  sender,
  receiver,
  metadata,
}: {
  req: Request;
  user_id: Types.ObjectId;
  action: string;
  description?: string;
  sender?: Types.ObjectId;
  receiver?: Types.ObjectId;
  metadata?: any;
}) => {
  const ip =
    ((req.headers["x-forwarded-for"] as string) || "").split(",")[0]?.trim() ||
    req.socket.remoteAddress;
  const location = (req.headers["x-location"] as string) || "Unknown Location";
  const log = await ActivityLog.create({
    user_id,
    action,
    description,
    ip,
    sender,
    receiver,
    device: req.headers["user-agent"],
    location,
    // location field removed as it is not defined
    metadata,
  });
  return log;
};
