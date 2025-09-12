import { Schema, model, Types } from "mongoose";
import { generateRandom, timestamp } from "../../utils/util";
import { Document } from "mongoose";
import { Counter } from "../counter";

export interface IOffice extends Document {
  name: string; // e.g., "Lagos Office"
  _id: Types.ObjectId;
  address?: string;
  office_id?: string; // Unique identifier for the office
  internal_sequence?: number; // Sequence number for internal tracking
  created_by: Types.ObjectId; // Admin who created
  transactions: Types.ObjectId;
  workers: Types.ObjectId[];
  orders: Types.ObjectId[];
  logs: Types.ObjectId[];
  is_active: boolean;
  can_update_orders: boolean;
  wallet?: {
    balance: number;
    last_funded_by?: Types.ObjectId; // User who last funded the wallet
    last_funded_amount?: number; // Last funded amount
    logs?: Types.ObjectId[]; // Logs related to wallet transactions
  };
}

const officeSchema = new Schema<IOffice>(
  {
    name: { type: String, required: true },
    address: { type: String },
    internal_sequence: { type: Number, default: 0 },
    office_id: { type: String, unique: true },
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    is_active: { type: Boolean, default: true },
    can_update_orders: { type: Boolean, default: false },
    transactions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Finance",
      },
    ],
    workers: [{ type: Schema.Types.ObjectId, ref: "OfficeWorker" }],
    logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
    wallet: {
      balance: { type: Number, default: 0 },
      last_funded_by: { type: Schema.Types.ObjectId, ref: "User" },
      last_funded_amount: { type: Number },
      logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
    },
  },
  {
    timestamps: {
      ...timestamp,
    },
  }
);
officeSchema.pre(
  "save",
  async function (this: import("mongoose").Document & IOffice, next) {
    if (this.isNew) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Increment sequence for today
      const counter = await Counter.findOneAndUpdate(
        { name: "office", date: today },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );

      const seq = counter.sequence;
      this.internal_sequence = seq;

      // Random 5-character alphanumeric
      const randomPart = generateRandom(8, "00").toUpperCase();
      const datePart = today.replace(/-/g, "");
      const office_id = `OFC-${datePart}-${randomPart}-${String(seq).padStart(
        4,
        "0"
      )}`;
      this.office_id = office_id;
    }
    next();
  }
);
const Offices = model<IOffice>("Office", officeSchema);

export default Offices;
