import { Schema, model } from "mongoose";
import { IUser } from "../types/type";
import { encrypt } from "../utils/bcrypt.util";
// Optional: enums for role and approval status

const userSchema = new Schema<IUser>(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    username: String,
    date_joined: { type: Date, default: Date.now },
    last_login: { type: Date },
    approved_at: Date,
    rejected_at: Date,
    approved_by: { type: Schema.Types.ObjectId, ref: "User" },
    rejected_by: { type: Schema.Types.ObjectId, ref: "User" },
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
    warehouse_location: { type: String },
    warehouse_photos: {
      internal: [],
      external: [],
    },
    warehouse_verified: { type: Boolean, default: false },
    inventory_obligations_accepted: { type: Boolean, default: false },
    status: {
      type: String,
      default: "pending_for_documents",
    },
    password: { type: String, required: true },
    forgot_password_expires: { type: String },
    forgot_password_token: { type: String },
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

    account_details: {
      bank_name: { type: String },
      account_number: { type: String },
      account_name: { type: String },
    },
    paid_registration_fee: { type: Boolean, default: false },
    documents: Schema.Types.Mixed,
    admin_notes: String,
    years_in_operation: Number,
    registration_number: Number,

    logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
  },
  {
    timestamps: true,
  }
);
userSchema.virtual('fullName').get(function () {
  return `${this.first_name} ${this.last_name}`;
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await encrypt(this.password);
  next();
});


export default model<IUser>("User", userSchema);
