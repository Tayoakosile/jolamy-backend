import { ActivityLog } from "../models/ActivityLog";

// src/utils/logActivity.ts


export const logActivity = async ({
  userId,
  action,
  description,
  ip,
  device,
  location,
  metadata,
}: {
  userId: string;
  action: string;
  description?: string;
  ip?: string;
  device?: string;
  location?: string;
  metadata?: any;
}) => {
  const log=await ActivityLog.create({
    userId,
    action,
    description,
    ip,
    device,
    location,
    metadata,
  });
  return log;
};
