import mongoose, { Schema, Document, Types } from "mongoose";
import { Counter } from "./counter";
import { generateRandom } from "../utils/util";
import { timeStamp } from "console";

export interface ITransaction extends Document {
  transaction_id: string;
  delivery_address: string;
  internal_sequence: number;
  date: Date;
  due_date: Date;
  logs: Types.ObjectId[]; // Array of log IDs
  description: string;
  payment_method: string; // e.g., "bank_transfer", "mobile_money", "cash"
  status: "pending" | "completed" | "failed" | "reversed";
  total: number; // Total amount in lowest currency unit (e.g., kobo, cents)
  receipt: string; // URL or path to the transaction receipt
  metadata?: Record<string, any>; // Additional metadata about the transaction
  user_id: Types.ObjectId; // User ID associated with the transaction
  user_role: "distributor" | "sales_agent"; // Role of the user
  order_id: Types.ObjectId; // Order ID associated with the transaction
  office_id?: Types.ObjectId;
  transaction_type: "credit" | "debit";
  type: "credit" | "debit";
  created_at:Date,
  category: "wallet_funding" | "order_payment" | "bonus_settlement" | "other";
}

// const PricingSchema = new Schema<Pricing>(
//   {
//     distributor_price_per_box: { type: Number, required: true },
//     profit_per_box: { type: Number, required: true },
//     first_time_min_order_qty: { type: Number, required: true },
//     next_order_min_qty: { type: Number }, // optional for sales agent
//     sales_agent_price_per_unit: { type: Number },
//     bonus_per_box: { type: Number },
//   },
//   { _id: false }
// );

const TransactionSchema = new Schema<ITransaction>(
  {
    transaction_id: { type: String, immutable: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
    user_role: {
      type: String,
      enum: ["admin", "distributor", "sales_agent"],
      required: true,
    },
    date: { type: Date, default: Date.now },
    due_date: { type: Date },
    delivery_address: { type: String },
    internal_sequence: { type: Number, default: 0 },
    office_id: { type: Schema.Types.ObjectId, ref: "Office" },
    order_id: { type: Schema.Types.ObjectId, ref: "Order" },

    transaction_type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    category: {
      type: String,
      enum: ["wallet_funding", "order_payment", "bonus_settlement", "other"],
      required: true,
    },

    description: { type: String },
    total: { type: Number, required: true, min: 0 },
    // balance_after: { type: Number, required: true, min: 0 },
    payment_method: {
      type: String,
      enum: ["cash", "bank_transfer", "pos", "wallet", "other"],
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: { ...timeStamp } }
);


TransactionSchema.pre(
  "save",
  async function (this: import("mongoose").Document & ITransaction, next) {
    if (this.isNew) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Increment sequence for today
      const counter = await Counter.findOneAndUpdate(
        { name: "order", date: today },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );

      const seq = counter.sequence;
      this.internal_sequence = seq;

      // Random 5-character alphanumeric
      const randomPart = generateRandom(8, "00").toUpperCase();
      const datePart = today.replace(/-/g, "");
      const transaction_id = `TRX-${datePart}-${randomPart}-${String(
        seq
      ).padStart(4, "0")}`;
      this.transaction_id = transaction_id;
    }
    next();
  }
);
const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);

export default Transaction;
