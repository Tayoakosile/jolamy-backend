import { Schema, model, Types, Document } from "mongoose";

export interface IBonus extends Document {
  bonus_id: string; // Unique bonus reference
  user_id: Types.ObjectId; // Distributor or sales agent
  role: "distributor" | "sales_agent";
  bonus_type: "sales_target" | "referral" | "performance";
  payment_status: "unpaid" | "paid" | "failed" | "reversed";
  status: "pending" | "processing" | "completed" | ""; // Status of the bonus
  payment_account_details: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
  payment_receipt?: string; // URL or path to payment receipt
  payment_reference?: string; // URL or path to payment receipt
  payment_confirmed?: boolean;
  no_of_boxes_sold: number;
  bonus_per_box: number;
  total_bonus_earned: number;
  description?: string;
  amount: number; // In lowest currency unit (e.g., kobo, cents)
  is_paid: boolean;
  paid_at?: Date;
  confirmed_at?: Date;
  related_orders?: Types.ObjectId[]; // Orders that contributed to the bonus
  period: {
    start_date: Date;
    end_date: Date;
  };
  created_at: Date;
  updated_at: Date;
}

const BonusSchema = new Schema<IBonus>(
  {
    bonus_id: { type: String, required: true, unique: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["distributor", "sales_agent"],
      required: true,
    },
    bonus_type: {
      type: String,
      enum: ["sales_target", "referral", "performance"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "reversed"],
      default: "pending",
    },

    description: { type: String },
    no_of_boxes_sold: { type: Number, required: true },
    bonus_per_box: { type: Number, required: true },
    payment_receipt: { type: String },
    payment_reference: { type: String },
    payment_account_details: {
      bank_name: { type: String, required: true },
      account_number: { type: String, required: true },
      account_name: { type: String, required: true },
    },
    total_bonus_earned: { type: Number, required: true },
    is_paid: { type: Boolean, default: false },
    paid_at: { type: Date },
    confirmed_at: { type: Date },
    payment_status: {
      type: String,
      enum: ["unpaid", "paid", "failed", "reversed"],
      default: "unpaid",
    },
    related_orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    period: {
      start_date: { type: Date, required: true },
      end_date: { type: Date, required: true },
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default model<IBonus>("Bonus", BonusSchema);
