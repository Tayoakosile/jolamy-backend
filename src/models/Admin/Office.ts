import { Schema, model, Types } from "mongoose";
import { timestamp } from "../../utils/util";

export interface IOffice {
  name: string; // e.g., "Lagos Office"

  address?: string;
  created_by: Types.ObjectId; // Admin who created
  transactions: Types.ObjectId; // Admin who created
  workers: Types.ObjectId[]; // Admin who created
  logs: Types.ObjectId[]; // Admin who created
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
    transactions: {
      type: Schema.Types.ObjectId,
      ref: "Finance",
      required: true,
    },
    workers: [{ type: Schema.Types.ObjectId, ref: "OfficeWorker" }],
    logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
    wallet: {
      office: { type: Schema.Types.ObjectId, ref: "Office", required: true },
      balance: { type: Number, default: 0 },
      lastFundedBy: { type: Schema.Types.ObjectId, ref: "User" },
      lastFundedAmount: { type: Number },
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
