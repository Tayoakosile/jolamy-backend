"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const util_1 = require("../utils/util");
const counter_1 = require("./counter");
const BonusSchema = new mongoose_1.Schema({
    recipients: {
        distributor: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sales_agent: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    date: { type: Date, default: Date.now },
    internal_sequence: { type: Number, immutable: true },
    bonus_type: {
        type: String,
        enum: ["sales_target", "referral", "performance"],
        required: true,
    },
    // status: {
    //   type: String,
    //   enum: ["pending", "processing", "completed", "reversed"],
    //   default: "pending",
    // },
    description: { type: String },
    no_of_boxes_sold: { type: Number, required: true },
    order: { type: String, ref: "Order" },
    bonus_per_box: { distributor: Number, sales_agent: Number },
    payment_receipt: { type: String },
    payment_reference: { distributor: String, sales_agent: String },
    paystack_payment_reference: {
        distributor: { type: String },
        sales_agent: { type: String },
    },
    total_bonus_earned: { type: Number, required: true },
    total_amount: {
        distributor: {
            type: Number,
            required: true,
            default: 0,
        },
        sales_agent: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    is_paid: {
        distributor: { type: Boolean, default: false },
        sales_agent: { type: Boolean, default: false },
    },
    paid_at: {
        distributor_at: Date,
        sales_agent_at: Date,
    },
    payment_confirmed: {
        distributor: { type: Boolean, default: false },
        sales_agent: { type: Boolean, default: false },
    },
    confirmed_at: {
        distributor: { type: Date },
        sales_agent: { type: Date },
    },
    payment_status: {
        distributor: {
            type: String,
            enum: ["unpaid", "processing", "paid", "failed", "reversed"],
            default: "unpaid",
        },
        sales_agent: {
            type: String,
            enum: ["unpaid", "processing", "paid", "failed", "reversed"],
            default: "unpaid",
        },
    },
    bonus_id: { type: String },
    period: {
        start_date: { type: Date, required: true },
        end_date: { type: Date, required: true },
    },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
BonusSchema.pre("save", async function (next) {
    if (this.isNew) {
        const today = new Date().toISOString().split("T")[0];
        // Increment sequence for today
        const counter = await counter_1.Counter.findOneAndUpdate({ name: "product", date: today }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
        const seq = counter.sequence;
        this.internal_sequence = seq;
        // Random 5-character alphanumeric
        const randomPart = (0, util_1.generateRandom)(8, "00").toUpperCase();
        const datePart = today.replace(/-/g, "");
        const bonus_number = `BNS-${datePart}-${randomPart}-${String(seq).padStart(4, "0")}`;
        this.bonus_id = bonus_number;
    }
    next();
});
exports.default = (0, mongoose_1.model)("Bonus", BonusSchema);
