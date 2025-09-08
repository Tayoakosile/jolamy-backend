import { Schema, model } from "mongoose";
import { IStockLog, IUser } from "../types/type";
import { encrypt, isMatch } from "../utils/bcrypt.util";
import { generateRandom, timestamp } from "../utils/util";
import { Counter } from "./counter";
// Optional: enums for role and approval status

const stockLogSchema = new Schema<IStockLog>(
  {
    internal_sequence: { type: Number },
    type: {
      type: String,
      enum: ["restock", "deduction", "delivery", "adjustment"],
      required: true,
    },
    quantity: { type: Number, required: true },
    previous_stock: { type: Number },
    stock_log_id: { type:String },
    new_stock: { type: Number },
    reason: { type: String },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" }, // admin / system
    user_id: { type: Schema.Types.ObjectId, ref: "User" }, // whose stock is updated

  },

  {
    timestamps: {
      ...timestamp,
    },
  }
);

stockLogSchema.pre(
  "save",
  async function (this: import("mongoose").Document & IStockLog, next) {
    if (this.isNew) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Increment sequence for today
      const counter = await Counter.findOneAndUpdate(
        { name: "stock_logs", date: today },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );

      const seq = counter.sequence;
      this.internal_sequence = seq;

      // Random 5-character alphanumeric
      const randomPart = generateRandom(8, "0A").toUpperCase();

      const datePart = today.replace(/-/g, "");
      const stock_log_id = `STKLOG-${datePart}-${randomPart}-${String(seq).padStart(
        4,
        "0"
      )}`;
      this.stock_log_id = stock_log_id;
    }
    next();
  }
);

export default model<IStockLog>("StockLog", stockLogSchema);
