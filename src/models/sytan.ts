import { Schema, model, Types } from "mongoose";
import { timestamp } from "../utils/util";

// 👷 2. models/OfficeWorker.ts

// 💳 3. models/OfficeWallet.ts

export interface IOfficeWallet {
  office: Types.ObjectId;
  balance: number;
  lastFundedBy?: Types.ObjectId; // admin
  lastFundedAmount?: number;
  updatedAt?: Date;
}

const walletSchema = new Schema<IOfficeWallet>(
  {
    office: { type: Schema.Types.ObjectId, ref: "Office", required: true },
    balance: { type: Number, default: 0 },
    lastFundedBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastFundedAmount: { type: Number },
  },
  {
    timestamps: {
      ...timestamp,
    },
  }
);

export const OfficeWallet = model<IOfficeWallet>("OfficeWallet", walletSchema);

// 📒 4. models/OfficeFinanceLog.ts

export interface IOfficeFinanceLog {
  office: Types.ObjectId;
  type: "inflow" | "outflow";
  amount: number;
  description?: string;
  category: string; // "supply", "transport", "salary", etc.
  reference?: string;
  createdBy: Types.ObjectId;
}

const financeLogSchema = new Schema<IOfficeFinanceLog>(
  {
    office: { type: Schema.Types.ObjectId, ref: "Office", required: true },
    type: { type: String, enum: ["inflow", "outflow"], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String },
    reference: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: {
      ...timestamp,
    },
  }
);

export const OfficeFinanceLog = model<IOfficeFinanceLog>(
  "OfficeFinanceLog",
  financeLogSchema
);
