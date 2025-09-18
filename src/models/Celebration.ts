import { Schema, model, Document, Types } from "mongoose";
import { timestamp } from "../utils/util";

export interface Celebration extends Document {
  user_id: Types.ObjectId;
  type:
    | "birthday"
    | "anniversary"
    | "first_purchase"
    | "first_bonus"
    | "milestone"
    | "rank";
  title: string;
  status: string;
  message?: string;
  dob: {
    day: number;
    month: number;
  };
  icon?: string;
  created_at?: string;
  animation?: string;
  meta?: Record<string, unknown>; // flexible for extra data
  is_seen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CelebrationSchema = new Schema<Celebration>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dob: {
      day: { type: Number, required: true },
      month: { type: Number, required: true },
    },
    status: { type: String },
    type: {
      type: String,
      enum: [
        "birthday",
        "anniversary",
        "first_purchase",
        "first_bonus",
        "milestone",
        "rank",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String },
    icon: { type: String },
    animation: { type: String },
    meta: { type: Schema.Types.Mixed }, // flexible for extra info
    is_seen: { type: Boolean, default: false },
  },
  { timestamps: { ...timestamp } }
);

export const CelebrationModel = model<Celebration>(
  "Celebration",
  CelebrationSchema
);
