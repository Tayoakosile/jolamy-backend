import { Document, model, Schema, Types } from "mongoose";
import { generateRandom } from "../utils/util";
import { Counter } from "./counter";

export interface INotification extends Document {
  user: Schema.Types.ObjectId;
  title: string;
  message: string;
  type: string;
  link: string;
  internal_sequence: number;
  notification_id: string;
  read_at: Date;
  is_read: boolean;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: String,
    internal_sequence: { type: Number, immutable: true },
    message: String,
    notification_id: String,
    read_at: Date,
    type: String, // e.g. "order", "promo", "system"
    link: String, // where to redirect when clicked
    is_read: { type: Boolean, default: false }, // read/unread flag
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);
NotificationSchema.pre(
  "save",
  async function (this: import("mongoose").Document & INotification, next) {
    if (this.isNew) {
      const today = new Date().toISOString().split("T")[0];

      // Increment sequence for today
      const counter = await Counter.findOneAndUpdate(
        { name: "notification", date: today },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );

      const seq = counter.sequence;
      this.internal_sequence = seq;
      // Random 5-character alphanumeric
      const randomPart = generateRandom(8, "00").toUpperCase();
      const datePart = today.replace(/-/g, "");
      const bonus_number = `NOT-${datePart}-${randomPart}-${String(
        seq
      ).padStart(4, "0")}`;
      this.notification_id = bonus_number;
    }
    next();
  }
);
export default model<INotification>("Notification", NotificationSchema);
