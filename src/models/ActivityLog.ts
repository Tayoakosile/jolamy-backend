// src/models/activityLog.model.ts
import mongoose from "mongoose";
import { timestamp } from "../utils/util";

const activityLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Types.ObjectId, ref: "User" },
    action: String,
    description: String,
    sender: { type: mongoose.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Types.ObjectId, ref: "User" },
    ip: String,
    device: String,
    location: String,
    metadata: Object,
  },
  {
    timestamps: {
      ...timestamp,
    },
  }
);

export const ActivityLog = mongoose.model("Log", activityLogSchema);
