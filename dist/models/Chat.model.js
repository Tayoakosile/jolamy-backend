"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const counter_1 = require("./counter");
const util_1 = require("../utils/util");
const ChatSchema = new mongoose_1.Schema({
    sender: { type: String, id: { type: mongoose_1.Types.ObjectId, ref: "User", required: true } },
    office: { type: mongoose_1.Types.ObjectId, ref: "Office", required: false },
    order_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order", required: true },
    receiver: { type: String, id: { type: mongoose_1.Types.ObjectId, ref: "User", required: true } },
    content: { type: String, required: true },
    "mentions": [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
}, { timestamps: { ...util_1.timestamp } });
ChatSchema.pre("save", async function (next) {
    if (this.isNew) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        // Increment sequence for today
        const counter = await counter_1.Counter.findOneAndUpdate({ name: "chat", date: today }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
        const seq = counter.sequence;
        this.internal_sequence = seq;
        // Random 5-character alphanumeric
        const randomPart = (0, util_1.generateRandom)(8, "00").toUpperCase();
        const datePart = today.replace(/-/g, "");
        const chat_id = `CHT-${datePart}-${randomPart}-${String(seq).padStart(4, "0")}`;
        this.chat_id = chat_id;
    }
    next();
});
const Order = (0, mongoose_1.model)("Order", ChatSchema);
exports.default = Order;
