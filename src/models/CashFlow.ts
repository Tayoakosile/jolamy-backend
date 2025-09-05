import { Schema, model, Types, Document } from "mongoose";
import { generateRandom, timestamp } from "../utils/util";
import { Counter } from "./counter";

export interface IFinance extends Document {
  type: "inflow" | "outflow";
  amount: number;
  payment_method?: string; // e.g., "bank_transfer", "cash", "pos", "mobile_money"
  category: string; // e.g., "Product Sales", "Delivery Cost", "Marketing", "Commission"
  description?: string;
  internal_sequence?: number;
  cashflow_id?: string;
  department?: string;
  notes?: string;
  office_id: { type: Schema.Types.ObjectId; ref: "Office" };
  status: string; // e.g., "pending", "completed", "cancelled"
  internal_reference?: string;
  created_by: { type: Schema.Types.ObjectId; ref: "User"; required: true }; // Ref to User
  created_at: Date;
  attachments?: string[]; // URL or path to payment proof document
  reference?: string; // optional external ID or notes
}

/** @type {*} */
const financeSchema = new Schema<IFinance>(
  {
    type: {
      type: String,
      enum: ["inflow", "outflow", "transaction-in", "transaction-out"],
      required: true,
    },
    amount: { type: Number, required: true },
    internal_sequence: { type: Number, default: 0 },
    cashflow_id: { type: String, unique: true },
    office_id: { type: Schema.Types.ObjectId, ref: "Office", required: true },
    payment_method: { type: String, trim: true },
    attachments: { type: [] },
    category: { type: String, required: true },
    description: { type: String },
    notes: { type: String },
    status: { type: String },
    reference: { type: String },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "OfficeWorker",
      required: true,
    },
  },
  {
    timestamps: { ...timestamp },
  }
);

financeSchema.pre(
  "save",
  async function (this: import("mongoose").Document & IFinance, next) {
    if (this.isNew) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Increment sequence for today
      const counter = await Counter.findOneAndUpdate(
        { name: "finance", date: today },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );

      const seq = counter.sequence;
      this.internal_sequence = seq;

      // Random 5-character alphanumeric
      const randomPart = generateRandom(8, "00").toUpperCase();
      const datePart = today.replace(/-/g, "");
      const cashflow_id = `CSF-${datePart}-${randomPart}-${String(seq).padStart(
        4,
        "0"
      )}`;
      this.cashflow_id = cashflow_id;
    }
    next();
  }
);
export default model<IFinance>("Finance", financeSchema);
