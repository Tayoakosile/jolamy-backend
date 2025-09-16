import mongoose, { Schema, Document } from "mongoose";
import { Counter } from "./counter";
import { generateRandom, timestamp } from "../utils/util";

interface Variant extends Document {
  sku: string;
  barcode: string;
  is_active: boolean;
  attributes: { key: string; value: string }[]; // e.g., [{key: "color", value: "red"}, {key: "size", value: "M"}]
  available_weight: string; // e.g., '500g', '1kg'
  name: string;
  inventory_alert_threshold: number;
  units_per_box: number;
  total_boxes_in_stock: number | null; // null means unlimited
  total_boxes_sold: number | null; // null means unlimited
  unit_type: string;

  distributor_pricing: {
    distributor_price_per_box: number;
    profit_per_box: number;
    price_per_box: number;
    first_time_min_order_qty: number;
  };

  sales_agent_pricing: {
    sales_agent_price_per_unit: number;
    bonus_per_box: number;
    first_time_min_order_qty: number;
    next_order_min_qty: number;
  };
}

export interface IProduct extends Document {
  name: string;
  sales_agent_price_per_box: number;
  distributor_price_per_box: number;
  total_boxes_in_stock: number;
  total_boxes_sold: number;
  min_order_quantity: number;
  inventory_alert_threshold: number;
  max_order_quantity: number;

  internal_sequence: number;
  product_id: string;
  sku: string;
  options: { name: string; values: string[] }[];
  reference_id?: string; // optional external ID or reference
  description?: string;

  orders: mongoose.Types.ObjectId[]; // references to orders
  category?: string;
  quantity?: number;
  archived_at?: string;
  archived_by?: string;
  product_images?: string[];
  logs?: mongoose.Types.ObjectId[]; // references to logs
  is_active: boolean;
  is_archived: boolean; // added for archiving products
  variants: Variant[];
  created_by: mongoose.Types.ObjectId;
}

const OptionSchema = new Schema({
  name: { type: String }, // e.g., "Size"
  values: [{ type: String }], // e.g., ["Small", "Large", "XL"]
});

const VariantSchema = new Schema<Variant>({
  name: { type: String, required: true }, // e.g., "Red - M"
  attributes: [
    {
      key: { type: String },
      value: { type: String },
    },
  ],
  sku: { type: String, unique: true, sparse: true },
  barcode: { type: String },
  is_active: { type: Boolean, default: true },
  inventory_alert_threshold: { type: Number, default: 50 },
  units_per_box: { type: Number, default: 0 },
  total_boxes_in_stock: { type: Number, default: null }, // null means unlimited
  total_boxes_sold: { type: Number, default: 0 }, // null means unlimited
  unit_type: { type: String, default: "box" }, // e.g., 'kg', 'litre', 'unit'
  distributor_pricing: {
    price_per_box: { type: Number, default: 0 },
    profit_per_box: { type: Number, default: 0 },
    first_time_min_order_qty: { type: Number, default: 150 },
  },

  sales_agent_pricing: {
    price_per_unit: { type: Number, default: 0 },
    price_per_box: { type: Number, default: 0 },
    bonus_per_box: { type: Number, default: 0 },
    first_time_min_order_qty: { type: Number, default: 0 },
  },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    min_order_quantity: { type: Number, default: 150 },
    max_order_quantity: { type: Number, default: 10000 },
    inventory_alert_threshold: { type: Number, default: 50 },
    sku: { type: String, unique: true, sparse: true },
    description: String,
    category: String,
    options: [OptionSchema],
    reference_id: String,
    sales_agent_price_per_box: { type: Number, required: true },
    distributor_price_per_box: { type: Number, required: true },
    product_id: String,
    total_boxes_in_stock: { type: Number, default: null }, // null means unlimited
    total_boxes_sold: { type: Number, default: 0 }, // null means unlimited
    product_images: { type: Array },
    internal_sequence: { type: Number, unique: true, immutable: true },
    is_active: { type: Boolean, default: true },
    is_archived: { type: Boolean, default: false }, // added for archiving products
    archived_at: { type: Date }, // optional field to track when the product was archived
    archived_by: { type: Schema.Types.ObjectId, ref: "User" }, // reference to the admin who archived the product
    variants: [VariantSchema],
    logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { ...timestamp } }
);

ProductSchema.pre(
  "save",
  async function (this: import("mongoose").Document & IProduct, next) {
    if (this.isNew) {
      const today = new Date().toISOString().split("T")[0];

      // Increment sequence for today
      const counter = await Counter.findOneAndUpdate(
        { name: "product", date: today },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );

      const seq = counter.sequence;
      this.internal_sequence = seq;
      // Random 5-character alphanumeric
      const randomPart = generateRandom(8, "00").toUpperCase();
      const datePart = today.replace(/-/g, "");
      const product_number = `PRD-${datePart}-${randomPart}-${String(
        seq
      ).padStart(4, "0")}`;
      this.product_id = product_number;
    }
    next();
  }
);

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
