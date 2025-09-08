"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const util_1 = require("../utils/util");
const counter_1 = require("./counter");
// Optional: enums for role and approval status
const stockLogSchema = new mongoose_1.Schema({
    internal_sequence: { type: Number },
    type: {
        type: String,
        enum: ["restock", "deduction", "delivery", "adjustment"],
        required: true,
    },
    quantity: { type: Number, required: true },
    previous_stock: { type: Number },
    stock_log_id: { type: String },
    new_stock: { type: Number },
    reason: { type: String },
    order: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order" },
    updated_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" }, // admin / system
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" }, // whose stock is updated
}, {
    timestamps: {
        ...util_1.timestamp,
    },
});
stockLogSchema.pre("save", async function (next) {
    if (this.isNew) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        // Increment sequence for today
        const counter = await counter_1.Counter.findOneAndUpdate({ name: "stock_logs", date: today }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
        const seq = counter.sequence;
        this.internal_sequence = seq;
        // Random 5-character alphanumeric
        const randomPart = (0, util_1.generateRandom)(8, "0A").toUpperCase();
        const datePart = today.replace(/-/g, "");
        const stock_log_id = `STKLOG-${datePart}-${randomPart}-${String(seq).padStart(4, "0")}`;
        this.stock_log_id = stock_log_id;
    }
    next();
});
exports.default = (0, mongoose_1.model)("StockLog", stockLogSchema);
