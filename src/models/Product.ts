import mongoose, { Schema, Document } from "mongoose";

interface Pricing {
  distributor_price_per_box: number;
  profit_per_box: number;
  first_time_min_order_qty: number;
  next_order_min_qty?: number; // for sales agent
  sales_agent_price_per_unit?: number;
  bonus_per_box?: number;
}

interface Variant {
  available_weight: string; // e.g., '500g', '1kg'
  name: string;
  inventory_alert_threshold: number;
  units_per_box: number;
  total_boxes_in_stock: number | null; // null means unlimited
  unit_type: string; // e.g., "bag", "sachet"

  distributor_pricing: {
    distributor_price_per_box: number;
    profit_per_box: number;
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
  inventory: [];
  reference_id?: string; // optional external ID or reference
  description?: string;
  available_weight: { type: String; required: true };
  orders: mongoose.Types.ObjectId[]; // references to orders
  category?: string;
  archived_at?: string;
  archived_by?: string;
  product_images?: string[];
  logs?: mongoose.Types.ObjectId[]; // references to logs
  is_active: boolean;
  is_archived: boolean; // added for archiving products
  variants: Variant[];
  created_by: mongoose.Types.ObjectId;
}

const PricingSchema = new Schema<Pricing>(
  {
    distributor_price_per_box: { type: Number, required: true },
    profit_per_box: { type: Number, required: true },
    first_time_min_order_qty: { type: Number, required: true },
    next_order_min_qty: { type: Number }, // optional for sales agent
    sales_agent_price_per_unit: { type: Number },
    bonus_per_box: { type: Number },
  },
  { _id: false }
);

const VariantSchema = new Schema<Variant>(
  {
    name: { type: String, required: true },

    inventory_alert_threshold: { type: Number, required: true },
    units_per_box: { type: Number, required: true },
    total_boxes_in_stock: { type: Number, default: null }, // null means unlimited
    unit_type: { type: String, required: true },

    distributor_pricing: {
      price_per_box: { type: Number, required: true },
      profit_per_box: { type: Number, required: true },
      first_time_min_order_qty: { type: Number, default: 150 },
    },

    sales_agent_pricing: {
      price_per_unit: { type: Number },
      price_per_box: { type: Number },
      bonus_per_box: { type: Number, required: true },
      first_time_min_order_qty: { type: Number },
      //   next_order_min_qty: { type: Number, required: true },
    },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: String,
    category: String,
    reference_id: String,
    product_images: { type: Array, required: true },
    available_weight: [{ type: String, required: true }], // e.g., '500g', '1kg'
    is_active: { type: Boolean, default: true },
    is_archived: { type: Boolean, default: false }, // added for archiving products
    archived_at: { type: Date }, // optional field to track when the product was archived
    archived_by: { type: Schema.Types.ObjectId, ref: "User" }, // reference to the admin who archived the product
    variants: [VariantSchema],
    logs: [{ type: Schema.Types.ObjectId, ref: "Log" }],
    inventory: [
      {
        variant: {
          type: String,
          required: true,
        },
        in_stock: { type: Number, required: true },
        total_sold: { type: Number, default: 0 },
        min_threshold: { type: Number, default: 0 },
        sold_this_month: { type: Number, default: 0 },
      },
    ],
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
