"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const util_1 = require("../utils/util");
const counter_1 = require("./counter");
/** @type {*} */
const financeSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ["inflow", "outflow", "transaction-in", "transaction-out"],
        required: true,
    },
    amount: { type: Number, required: true },
    internal_sequence: { type: Number, default: 0 },
    cashflow_id: { type: String, unique: true },
    office_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "Office", required: true },
    payment_method: { type: String, trim: true },
    attachments: { type: [] },
    category: { type: String, },
    description: { type: String },
    notes: { type: String },
    status: { type: String },
    reference: { type: String },
    created_by: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "OfficeWorker",
        required: true,
    },
}, {
    timestamps: { ...util_1.timestamp },
});
financeSchema.pre("save", async function (next) {
    if (this.isNew) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        // Increment sequence for today
        const counter = await counter_1.Counter.findOneAndUpdate({ name: "finance", date: today }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
        const seq = counter.sequence;
        this.internal_sequence = seq;
        // Random 5-character alphanumeric
        const randomPart = (0, util_1.generateRandom)(8, "00").toUpperCase();
        const datePart = today.replace(/-/g, "");
        const cashflow_id = `CSF-${datePart}-${randomPart}-${String(seq).padStart(4, "0")}`;
        this.cashflow_id = cashflow_id;
    }
    next();
});
exports.default = (0, mongoose_1.model)("Finance", financeSchema);
