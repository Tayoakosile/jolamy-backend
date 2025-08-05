// models/Cart.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { timestamp } from "../utils/util";

export interface ICartItem {
  user_id: Types.ObjectId;
  products: Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  total: number;
}

const CartItemSchema: Schema = new Schema<ICartItem>(
  {
    products: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const CartSchema: Schema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [CartItemSchema], required: true },
    total: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: {
      ...timestamp,
    },
  }
);

export const Cart = mongoose.model<ICart>("Cart", CartSchema);
