import { Schema, model, Types, Document } from "mongoose";

export interface IFinance extends Document {
  type: "inflow" | "outflow";
  amount: number;
  payment_method?: string; // e.g., "bank_transfer", "cash", "pos", "mobile_money"
  category: string; // e.g., "Product Sales", "Delivery Cost", "Marketing", "Commission"
  description?: string;
  department?: string;
  notes?: string;
  office_id: { type: Schema.Types.ObjectId; ref: "Office" };
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
    office_id: { type: Schema.Types.ObjectId, required: true },
    payment_method: { type: String, trim: true },
    attachments: { type: [] },
    category: { type: String, required: true, trim: true },
    description: { type: String },
    notes: { type: String },
    status: { type: String },
    reference: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

export default model<IFinance>("Finance", financeSchema);
