import { Schema, model, Types } from "mongoose";

export interface IFinance {
  type: "inflow" | "outflow";
  amount: number;
  payment_method?: string; // e.g., "bank_transfer", "cash", "pos", "mobile_money"
  category: string; // e.g., "Product Sales", "Delivery Cost", "Marketing", "Commission"
  description?: string;
  department?: string;
  notes?: string;
  status: string; // e.g., "pending", "completed", "cancelled"
  internal_reference?: string;
  created_by: { type: Schema.Types.ObjectId; ref: "User"; required: true }; // Ref to User
  created_at?: Date;
  attachments?: string[]; // URL or path to payment proof document
  reference?: string; // optional external ID or notes
}
/** @type {*} */
const financeSchema = new Schema<IFinance>(
  {
    type: {
      type: String,
      enum: ["inflow", "outflow"],
      required: true,
    },
    amount: { type: Number, required: true },
    payment_method: { type: String, trim: true },
    attachments: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String },
    notes: { type: String },
    status: { type: String },
    reference: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

export default model<IFinance>("Finance", financeSchema);
