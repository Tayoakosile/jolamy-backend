// models/Cart.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { timestamp } from "../utils/util";

export interface ICartItem {
  product: Types.ObjectId;
  variants: {
    _id: Types.ObjectId;
    name: string;
    quantity: number;
  }[];
  quantity: number;
  total: number; // total price for this item
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  total: { type: number; required: true }; // total price for this item;
}

const CartItemSchema: Schema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, default: 150 },
    variants: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          ref: "Product.variants",
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
  },
  { _id: false }
);

const CartSchema: Schema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: { type: [CartItemSchema], required: true },
  },
  {
    timestamps: {
      ...timestamp,
    },
  }
);

export const Cart = mongoose.model<ICart>("Cart", CartSchema);
