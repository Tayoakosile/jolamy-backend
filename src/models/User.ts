import { Schema, model } from "mongoose";
import { IUser } from "../types/type";
import { encrypt, isMatch } from "../utils/bcrypt.util";
import { generateRandom, timestamp } from "../utils/util";
import { Counter } from "./counter";
// Optional: enums for role and approval status

const userSchema = new Schema<IUser>(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    business_name: { type: String },
    user_id: { type: String, unique: true },

    username: String,
    date_joined: { type: Date, default: Date.now() },
    last_login: { type: Date, default: null },
    is_verified: { type: Boolean, default: false },
    celebrations: [{ type: Schema.Types.ObjectId, ref: "Celebration" }],
    approved_at: { type: Date, default: null },
    rejected_at: { type: Date, default: null },
    approved_by: { type: Schema.Types.ObjectId, ref: "User" },
    rejected_by: { type: Schema.Types.ObjectId, ref: "User" },
    change_requests: [{ type: Schema.Types.ObjectId, ref: "ChangeRequest" }],
    phone_number: String,
    gender: String,
    dob: {
      day: { type: Number },
      month: { type: Number },
      year: { type: Number },
    },
    total_boxes_ordered: { type: Number, default: 0 },
    total_boxes_sold: { type: Number, default: 0 },
    disabled_reason: String,
    is_first_login: { type: Boolean, default: true },
    email: { type: String, required: true, unique: true },
    cart: [{ type: Schema.Types.ObjectId, ref: "Cart" }],
    warehouse_location: { type: String },

    warehouse_verified: { type: Boolean, default: false },
    inventory_obligations_accepted: { type: Boolean, default: false },
    status: {
      type: String,
      default: "inactive",
    },
    files: {
      proof_of_identity: {
        id_type: { type: String },
        id_number: { type: String },
        files: { type: [] },
      },
      warehouse_photos: {
        interior: { type: [] },
        exterior: { type: [] },
      },
    },
    password: { type: String },
    internal_sequence: { type: Number, default: 0 },
    forgot_password_expires: { type: String },
    has_accepted_terms: { type: Boolean, default: false },
    forgot_password_token: { type: String },
    last_order_date: Date,
    user_role: {
      type: String,
      enum: ["admin", "distributor", "sales_agent", "worker", "factory_worker"],
    },
    teams: Schema.Types.Mixed,
    stats: Schema.Types.Mixed,
    outstanding_boxes: { type: Number, default: 0 },
    token_version: { type: Number, default: 0 },
    total_boxes_in_stock: { type: Number, default: 0 },
    stock_logs: [{ type: Schema.Types.ObjectId, ref: "StockLog" }],
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    sales_agent_orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    bonus: [{ type: Schema.Types.ObjectId, ref: "Bonus" }],
    transaction_history: [{ type: Schema.Types.ObjectId, ref: "Transaction" }],
    change_request: { type: Schema.Types.ObjectId, ref: "ChangeRequest" },
    account_details: {
      bank_name: { type: String, default: "" },
      account_number: { type: String, default: "" },
      account_name: { type: String, default: "" },
    },
    paid_registration_fee: { type: Boolean, default: false },
    documents: Schema.Types.Mixed,
    admin_notes: String,
    years_in_operation: Number,
    registration_number: Number,
    address: {
      distributors_address: {
        country: { type: String },
        state: { type: String },
        city: { type: String },
        postal_code: { type: String },
        address: { type: String },
      },
      business_address: {
        address: { type: String },
        country: { type: String },
        state: { type: String },
        city: { type: String },
        postal_code: { type: String },
      },
    },
    logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
  },
  {
    timestamps: {
      ...timestamp,
    },
  }
);
userSchema.virtual("full_name").get(function (this: IUser) {
  return `${this.first_name} ${this.last_name}`;
});
userSchema.virtual("is_admin").get(function (this: IUser) {
  return (this.is_admin = this.user_role === "admin");
});

userSchema.virtual("is_distributor").get(function (this: IUser) {
  return (this.is_distributor = this.user_role === "distributor");
});

userSchema.virtual("is_sales_agent").get(function (this: IUser) {
  return (this.is_sales_agent = this.user_role === "sales_agent");
});

userSchema.virtual("is_worker").get(function (this: IUser) {
  return (this.is_worker = this.user_role === "worker");
});

userSchema.virtual("is_factory_worker").get(function (this: IUser) {
  return (this.is_factory_worker = this.user_role === "factory_worker");
});

userSchema.pre(
  "save",
  async function (this: import("mongoose").Document & IUser, next) {
    if (!this.isModified("password")) return next();
    this.password = await encrypt(this.password);
    next();
  }
);
userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return await isMatch(candidatePassword, this.password);
};

userSchema.pre(
  "save",
  async function (this: import("mongoose").Document & IUser, next) {
    if (this.isNew) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Increment sequence for today
      const counter = await Counter.findOneAndUpdate(
        { name: "user", date: today },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );

      const seq = counter.sequence;
      this.internal_sequence = seq;

      // Random 5-character alphanumeric
      const randomPart = generateRandom(8, "0A").toUpperCase();

      const datePart = today.replace(/-/g, "");
      const user_id = `USR-${datePart}-${randomPart}-${String(seq).padStart(
        4,
        "0"
      )}`;
      this.user_id = user_id;
    }
    next();
  }
);

userSchema.pre(
  "save",
  function (this: import("mongoose").Document & IUser, next) {
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }
    if (this.username) {
      this.username = this.username.trim().toLowerCase();
    }
    next();
  }
);

export default model<IUser>("User", userSchema);
