import { Document, model, Schema, Types } from "mongoose";
import { Counter } from "./counter";
import { generateRandom, timestamp } from "../utils/util";
import {
    IDeliveryDetails,
    IOrder,
    IShippingDetails,
} from "../types/order.type";


export interface ChatParticipant {
  type: string;       // e.g., "user", "system" (free-form per your use)
  id: string; // User ID
}

export interface ChatMessage {
  sender: ChatParticipant;
  order_id: String;
  office?: String;
  receiver: ChatParticipant;
  content: String;
  mentions?: string[]; // User IDs mentioned
}
const ChatSchema = new Schema<ChatMessage>({
    sender: { type: String, id: { type: Types.ObjectId, ref: "User", required: true } },
    office: { type: Types.ObjectId, ref: "Office", required: false },
    order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    receiver: { type: String, id: { type: Types.ObjectId, ref: "User", required: true } },
    content: { type: String, required: true },
    "mentions": [{ type: Types.ObjectId, ref: "User" }],
}, { timestamps: { ...timestamp } });

ChatSchema.pre(
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
            const chat_id = `ORD-${datePart}-${randomPart}-${String(
                seq
            ).padStart(4, "0")}`;
            this.chat_id = chat_id;
        }
        next();
    }
);
const Order = model("Order", ChatSchema);
export default Order;
