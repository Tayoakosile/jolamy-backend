import { timeStamp } from "console";
import { Document, model, Schema, Types } from "mongoose";
import { Counter } from "./counter";

const ProductItemSchema = new Schema(
  {
    variants: [
      {
        id: { type: Types.ObjectId },
        quantity: { type: Number, required: true },
      },
    ],
  },
  { _id: false }
);

const ShippingLocationSchema = new Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    estimatedDate: { type: Date, required: true },
  },
  { _id: false }
);

interface ProductVariant {
  id: Types.ObjectId;
  quantity: number;
}

interface ProductItem {
  variants: ProductVariant[];
}

interface ShippingLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  phoneNumber: string;
  estimatedDate: Date;
}

type OrderRole = "distributor" | "sales_agent";
type PaymentStatus = "pending" | "paid" | "cancelled";
type DeliveryStatus = "not_assigned" | "in_transit" | "delivered" | "pending";
type RefundStatus = "none" | "pending" | "processed";
type PaymentMethod =
  | "bank_transfer"
  | "cash"
  | "pos"
  | "mobile_money"
  | "paystack"
  | null;

export interface IOrder extends Document {
  user_id: { type: Types.ObjectId; ref: "User"; required: true };
  assigned_to?: Types.ObjectId;
  order_number?: string;
  date?: Date;
  delivery_fee?: number;
  role: OrderRole;
  products: ProductItem[];
  shipping_location?: ShippingLocation;
  payment_status?: PaymentStatus;
  delivery_status?: DeliveryStatus;
  internal_notes?: string;
  internal_sequence?: number;
  transaction_id?: Types.ObjectId;
  total_amount?: number;
  estimated_delivery_date?: Date;
  actual_delivery_date?: Date;
  discount_amount?: number;
  tax_amount?: number;
  tracking_number?: string;
  courier_service?: string;
  cancelled_at?: Date;
  refund_status?: RefundStatus;
  fulfillment_type?: string;
  status: string;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  logs?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user_id: { type: Types.ObjectId, ref: "User", required: true },
    assigned_to: { type: Types.ObjectId, ref: "OfficeWorker" },
    order_number: { type: String },
    date: { type: Date, default: Date.now },
    delivery_fee: { type: Number },
    role: {
      type: String,
      enum: ["distributor", "sales_agent"],
      required: true,
    },
    products: { type: [ProductItemSchema], required: true },
    shipping_location: {
      type: ShippingLocationSchema,
    },
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
        "completed",
        "cancelled",
        "failed",
        "refunded",
      ],
      default: "pending",
    },
    delivery_status: {
      type: String,
      enum: ["not_assigned", "in_transit", "delivered", "pending"],
      default: "not_assigned",
    },
    internal_notes: { type: String },
    internal_sequence: { type: Number, default: 0 },
    total_amount: { type: Number },
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
    logs: { type: [Schema.Types.Mixed], default: [] },
  },
  {
    timestamps: true,
  }
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
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase();

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
