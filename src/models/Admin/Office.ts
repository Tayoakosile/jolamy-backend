import { Schema, model, Types } from "mongoose";
import { timestamp } from "../../utils/util";
import { Document } from "mongoose";

export interface IOffice extends Document {
  name: string; // e.g., "Lagos Office"
  _id: Types.ObjectId;
  address?: string;
  created_by: Types.ObjectId; // Admin who created
  transactions: Types.ObjectId;
  workers: Types.ObjectId[];
  logs: Types.ObjectId[];
  is_active: boolean;
  created_at?: Date;
  wallet?: Object;
}

const officeSchema = new Schema<IOffice>(
  {
    name: { type: String, required: true },
    address: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    is_active: { type: Boolean, default: true },
    transactions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Finance",
        required: true,
      },
    ],
    workers: [{ type: Schema.Types.ObjectId, ref: "OfficeWorker" }],
    logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
    wallet: {
      balance: { type: Number, default: 0 },
      lastFundedBy: { type: Schema.Types.ObjectId, ref: "User" },
      lastFundedAmount: { type: Number },
      logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
    },
  },
  {
    timestamps: {
      ...timestamp,
    },
  }
);

const Offices = model<IOffice>("Office", officeSchema);

export default Offices;
