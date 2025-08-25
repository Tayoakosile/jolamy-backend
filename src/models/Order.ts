import { Document, model, Schema, Types } from "mongoose";
import { Counter } from "./counter";
import { generateRandom, timestamp } from "../utils/util";
import {
  IDeliveryDetails,
  IOrder,
  IShippingDetails,
} from "../types/order.type";

const ProductItemSchema = new Schema({
  product_id: { type: Types.ObjectId, ref: "Product", required: true },
  variants: [
    {
      id: { type: Types.ObjectId, required: true },
      quantity: { type: Number, required: true },
      name: { type: String, required: true },
      total_boxes_in_stock: { type: Number, default: 0 },
      amount_per_box: { type: Number, required: false },
      total_amount: { type: Number, required: true },
    },
  ],
});

const ShippingSchema = new Schema<IShippingDetails>(
  {
    recipient_name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postal_code: { type: String },
    delivery_type: {
      type: String,
      enum: ["pickup", "delivery"],
      default: "delivery",
    },
    note_from_user: { type: String },
  },
  { _id: false } // embedded, no extra id
);

const DeliveryStepSchema = new Schema<IDeliveryDetails>(
  {
    label: {
      type: String,
      enum: [
        "order_placed",
        "order_paid_for",
        "order_processing",
        "on_the_way",
        "order_delivered",
        "order_on_hold",
        "order_cancelled",
        "order_failed",
      ],
    },
    date: { type: Date },
  },
  {
    timestamps: {
      ...timestamp,
    },
  } // embedded, no extra id
);

const OrderSchema = new Schema<IOrder>(
  {
    assigned_to: {
      office: { type: Types.ObjectId, ref: "Office", required: false },
      office_worker: {
        type: Types.ObjectId,
        ref: "OfficeWorker",
        required: false,
      },
    },

    user_id: { type: Types.ObjectId, ref: "User", required: true },
    priority_level: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
    },
    order_number: { type: String },
    date: { type: Date, default: Date.now },
    delivery_fee: { type: Number },
    delivery_steps: { type: [DeliveryStepSchema], required: true },
    role: {
      type: String,
      enum: ["distributor", "sales_agent"],
      required: true,
    },
    products: { type: [ProductItemSchema], required: true },
    shipping: { type: ShippingSchema },
    payment_status: {
      type: String,
      enum: [
        "unpaid",
        "failed",
        "pending",
        "initiated",
        "paid",
        "cancelled",
        "reversed",
        "abandoned",
      ],
      default: "initiated",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "delivered",
        "completed",
        "cancelled",
        "failed",
        "refunded",
      ],
      default: "pending",
    },
    delivery_status: {
      type: String,
      enum: ["not_assigned", "pending", "in_transit", "delivered"],
      default: "not_assigned",
    },
    internal_notes: { type: String },
    admin_notes_to_office: { type: String },
    admin_notes_to_customer: { type: String },
    internal_sequence: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 },
    grand_total: { type: Number, default: 0 }, // total_amount + delivery_fee
    total_quantity: { type: Number, default: 0 },
    estimated_delivery_date: { type: Date },
    actual_delivery_date: { type: Date },
    discount_amount: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    tracking_number: { type: String },
    courier_service: { type: String },
    cancelled_at: { type: Date },
    transaction_id: { type: Types.ObjectId, ref: "Transaction" },
    refund_status: {
      type: String,
      enum: ["none", "pending", "processed"],
      default: "none",
    },

    fulfillment_type: {
      type: String,
      // enum: ["delivery", "pickup"],
      default: "",
    },
    payment_method: {
      type: String,
      enum: ["bank_transfer", "cash", "pos", "mobile_money", "paystack", null],
      default: null,
    },
    payment_reference: { type: String },
    logs: [{ type: Types.ObjectId, ref: "Log" }],
  },
  { timestamps: { ...timestamp } }
);

OrderSchema.pre(
  "save",
  async function (this: import("mongoose").Document & IOrder, next) {
    if (this.isNew) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Increment sequence for today
      const counter = await Counter.findOneAndUpdate(
        { name: "order", date: today },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );

      const seq = counter.sequence;
      this.internal_sequence = seq;

      // Random 5-character alphanumeric
      const randomPart = generateRandom(8, "00").toUpperCase();
      const datePart = today.replace(/-/g, "");
      const order_number = `ORD-${datePart}-${randomPart}-${String(
        seq
      ).padStart(4, "0")}`;
      this.order_number = order_number;
    }
    next();
  }
);
const Order = model("Order", OrderSchema);
export default Order;
