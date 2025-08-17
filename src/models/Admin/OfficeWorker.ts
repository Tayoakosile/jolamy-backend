import { Schema, model, Types } from "mongoose";
import { generateRandom, timestamp } from "../../utils/util";
import { Document } from "mongoose";
import { encrypt } from "../../utils/bcrypt.util";
import { Counter } from "../counter";

export interface IOfficeWorker extends Document {
  role: string; // e.g., "finance", "storekeeper"
  phone: string;
  office: Types.ObjectId;
  internal_sequence: number;
  worker_id: string;
  first_name: string;
  last_name: string;
  password: string;
  username: string;
  email: string;
  employee_id: string;
  admin_notes: string;
  is_active: boolean;
  is_deactivated: boolean;
  is_deleted: boolean;
  last_login: Date;
  deactivated_by: Types.ObjectId;
  logs: Types.ObjectId[]; // logs of activities
  permissions: string[]; // logs of activities
  cash_flow: Types.ObjectId[]; // logs of activities
  orders_in_charge: Types.ObjectId[]; // logs of activities
  added_by: Types.ObjectId; // admin or office head
}

const officeWorkerSchema = new Schema<IOfficeWorker>(
  {
    office: { type: Schema.Types.ObjectId, ref: "Office", required: true },
    employee_id: { type: String },
    phone: { type: String },
    role: { type: String, required: true },
    internal_sequence: { type: Number, default: 0 },
    worker_id: { type: String, unique: true },
    permissions: { type: [], required: true }, // e.g., ["view_orders", "manage_finances"]
    is_active: { type: Boolean, default: true },
    last_login: { type: Date },
    admin_notes: { type: String },
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
    email: { type: String, required: true, unique: true },
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
officeWorkerSchema.virtual("is_first_login").get(function () {
  return this.last_login ? false : true;
});
officeWorkerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await encrypt(this.password);
  next();
});
officeWorkerSchema.pre(
  "save",
  async function (this: import("mongoose").Document & IOfficeWorker, next) {
    if (this.isNew) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Increment sequence for today
      const counter = await Counter.findOneAndUpdate(
        { name: "worker", date: today },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );

      const seq = counter.sequence;
      this.internal_sequence = seq;

      // Random 5-character alphanumeric
      const randomPart = generateRandom(8, "0A").toUpperCase();

      const datePart = today.replace(/-/g, "");
      const user_id = `WRK-${datePart}-${randomPart}-${String(seq).padStart(
        4,
        "0"
      )}`;
      this.worker_id = user_id;
    }
    next();
  }
);

const OfficeWorker = model<IOfficeWorker>("OfficeWorker", officeWorkerSchema);
export default OfficeWorker;
