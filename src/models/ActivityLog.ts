// src/models/activityLog.model.ts
import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User" },
    action: String,
    description: String,
    ip: String,
    device: String,
    location: String,
    metadata: Object,
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model("Logs", activityLogSchema);
