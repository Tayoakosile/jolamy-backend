"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const util_1 = require("../../utils/util");
const counter_1 = require("../counter");
const officeSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    address: { type: String },
    internal_sequence: { type: Number, default: 0 },
    office_id: { type: String, unique: true },
    created_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    orders: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Order" }],
    is_active: { type: Boolean, default: true },
    transactions: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Finance",
        },
    ],
    workers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "OfficeWorker" }],
    logs: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Log" }],
    wallet: {
        balance: { type: Number, default: 0 },
        last_funded_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
        lastFundedAmount: { type: Number },
        logs: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Log" }],
    },
}, {
    timestamps: {
        ...util_1.timestamp,
    },
});
officeSchema.pre("save", async function (next) {
    if (this.isNew) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        // Increment sequence for today
        const counter = await counter_1.Counter.findOneAndUpdate({ name: "office", date: today }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
        const seq = counter.sequence;
        this.internal_sequence = seq;
        // Random 5-character alphanumeric
        const randomPart = (0, util_1.generateRandom)(8, "00").toUpperCase();
        const datePart = today.replace(/-/g, "");
        const office_id = `OFC-${datePart}-${randomPart}-${String(seq).padStart(4, "0")}`;
        this.office_id = office_id;
    }
    next();
});
const Offices = (0, mongoose_1.model)("Office", officeSchema);
exports.default = Offices;
