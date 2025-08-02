import { Schema, model, Document, Types } from "mongoose";
// Optional: enums for role and approval status
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type UserRole = "admin" | "distributor" | "sales_agent" | "worker";

export interface IUser extends Document {
  name: string;
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  date_joined: Date;
  date_approved: Date;
  phone_number: string;
  gender: string;
  dob: Date;
  business_address: string;
  is_factory_worker: boolean;
  disabled_reason?: string;
  is_admin: boolean;
  is_distributor: boolean;
  is_sales_agent: boolean;
  is_worker: boolean;
  is_first_login: boolean;
  distribution_address?: string;

  status: ApprovalStatus;
  password: string;
  last_order_date?: Date;
  user_role: UserRole;
  teams: any;
  stats: any;
  outstanding_boxes: number;
  orders: { type: Types.ObjectId[]; ref: "Order" }; // refs to Order model
  products: { type: Types.ObjectId[]; ref: "Products" }; // refs to Product model
  bonus: { type: Types.ObjectId[]; ref: "Bonus" }; // refs to Bonus model
  transaction_history: { type: Types.ObjectId[]; ref: "TransactionHistory" }; // refs to Transaction model
  change_request: { type: Types.ObjectId; ref: "ChangeRequest" }; // refs to ChangeRequest model
  account_details: {
    bank_name: string;
    account_number: string;
    account_type: string;
  };
  paid_registration_fee: boolean;
  documents: any;
  admin_notes: string;
  years_in_operation: number;
  registration_number: number;
  referees: { type: Types.ObjectId[]; ref: "Referees" }; // refs to Referee model
  logs: { type: Types.ObjectId[]; ref: "Logs" }; // refs to Log model
}

const userSchema = new Schema<IUser>(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: String,
    date_joined: { type: Date, default: Date.now },
    date_approved: Date,
    phone_number: String,
    gender: String,
    dob: Date,
    business_address: String,
    is_factory_worker: { type: Boolean, default: false },
    disabled_reason: String,
    is_admin: { type: Boolean, default: false },
    is_distributor: { type: Boolean, default: false },
    is_sales_agent: { type: Boolean, default: false },
    is_worker: { type: Boolean, default: false },
    is_first_login: { type: Boolean, default: true },
    distribution_address: String,
    email: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    password: { type: String, required: true },
    last_order_date: Date,
    user_role: {
      type: String,
      enum: ["admin", "distributor", "sales_agent", "worker"],
    },
    teams: Schema.Types.Mixed,
    stats: Schema.Types.Mixed,
    outstanding_boxes: { type: Number, default: 0 },
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    bonus: [{ type: Schema.Types.ObjectId, ref: "Bonus" }],
    transaction_history: [{ type: Schema.Types.ObjectId, ref: "Transaction" }],
    change_request: { type: Schema.Types.ObjectId, ref: "ChangeRequest" },
    account_details: String,
    paid_registration_fee: { type: Boolean, default: false },
    documents: Schema.Types.Mixed,
    admin_notes: String,
    years_in_operation: Number,
    registration_number: Number,
    referees: [{ type: Schema.Types.ObjectId, ref: "Referee" }],
    logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
  },
  {
    timestamps: true,
  }
);

export default model<IUser>("User", userSchema);
