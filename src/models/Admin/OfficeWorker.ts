import { Schema, model, Types } from "mongoose";
import { timestamp } from "../../utils/util";
import { Document } from "mongoose";
import { encrypt } from "../../utils/bcrypt.util";

export interface IOfficeWorker extends Document {
  office: Types.ObjectId;
  role: string; // e.g., "finance", "storekeeper"
  first_name: string; // e.g., "finance", "storekeeper"
  last_name: string; // e.g., "finance", "storekeeper"
  password: string; // e.g., "finance", "storekeeper"
  username: string; // e.g., "finance", "storekeeper"
  email: string; // e.g., "finance", "storekeeper"
  employee_id: string; // e.g., "finance", "storekeeper"
  is_active: boolean;
  is_deactivated: boolean;
  is_deleted: boolean;
  deactivated_by: Types.ObjectId;
  logs: Types.ObjectId[]; // logs of activities
  cash_flow: Types.ObjectId[]; // logs of activities
  orders_in_charge: Types.ObjectId[]; // logs of activities
  added_by: Types.ObjectId; // admin or office head
}

const officeWorkerSchema = new Schema<IOfficeWorker>(
  {
    office: { type: Schema.Types.ObjectId, ref: "Office", required: true },
    employee_id: { type: String },
    role: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    is_deactivated: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    deactivated_by: { type: Schema.Types.ObjectId, ref: "User" },
    added_by: { type: Schema.Types.ObjectId, ref: "User" },
    logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
    cash_flow: [{ type: Schema.Types.ObjectId, ref: "CashFlow" }], // Reference to cash flow model
    orders_in_charge: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true,  },
    password: { type: String, required: true },
  },
  {
    timestamps: {
      ...timestamp,
    },
  }
);

officeWorkerSchema.virtual("fullName").get(function () {
  return `${this.first_name} ${this.last_name}`;
});
officeWorkerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await encrypt(this.password);
  next();
});

export const OfficeWorker = model<IOfficeWorker>(
  "OfficeWorker",
  officeWorkerSchema
);
