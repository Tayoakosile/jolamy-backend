import { Schema, model, Types } from "mongoose";

const ProductItemSchema = new Schema(
  {
    product_id: { type: Types.ObjectId, ref: "Product", required: true },
    variant_name: { type: String, required: true },
    weight: { type: String, required: true }, // e.g., "500g", "1kg"
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    total_price: { type: Number, required: true },
  },
  { _id: false }
);

const ShippingLocationSchema = new Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    order_id: { type: String, unique: true, required: true },
    distributor_id: { type: Types.ObjectId, ref: "User", required: true },
    assigned_to: { type: Types.ObjectId, ref: "OfficeWorker", required: true },
    date: { type: Date, default: Date.now },
    role: {
      type: String,
      enum: ["distributor", "sales_agent"],
      required: true,
    },
    products: { type: [ProductItemSchema], required: true },
    shipping_location: { type: ShippingLocationSchema, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    delivery_status: {
      type: String,
      enum: ["not_assigned", "in_transit", "delivered", "pending"],
      default: "not_assigned",
    },
    internal_notes: { type: String },
    amount: { type: Number, required: true },
    payment_method: {
      type: String,
      enum: ["bank_transfer", "cash", "pos", "mobile_money", "paystack"],
    },
    payment_reference: { type: String },
    logs: { type: [Schema.Types.Mixed], default: [] },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export default model("Order", OrderSchema);
