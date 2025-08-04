import { Schema, model, Types } from "mongoose";
import { timestamp } from "../../utils/util";
import { Document } from "mongoose";

export interface IOfficeWorker extends Document {
  office: Types.ObjectId;
  user: Types.ObjectId; // links to User schema
  role: string; // e.g., "finance", "storekeeper"
  employee_id: string; // e.g., "finance", "storekeeper"
  is_active: boolean;
  is_deactivated: boolean;
  deactivated_by: Types.ObjectId;
  added_by: Types.ObjectId; // admin or office head
}

const officeWorkerSchema = new Schema<IOfficeWorker>(
  {
    office: { type: Schema.Types.ObjectId, ref: "Office", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    employee_id: { type: String },
    role: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    is_deactivated: { type: Boolean, default: true },
    deactivated_by: { type: Schema.Types.ObjectId, ref: "User" },
    added_by: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: {
      ...timestamp,
    },
  }
);
export const OfficeWorker = model<IOfficeWorker>(
  "OfficeWorker",
  officeWorkerSchema
);
