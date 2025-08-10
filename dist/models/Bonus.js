"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BonusSchema = new mongoose_1.Schema({
    bonus_id: { type: String, required: true, unique: true },
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
        type: String,
        enum: ["distributor", "sales_agent"],
        required: true,
    },
    bonus_type: {
        type: String,
        enum: ["sales_target", "referral", "performance"],
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "reversed"],
        default: "pending",
    },
    description: { type: String },
    no_of_boxes_sold: { type: Number, required: true },
    bonus_per_box: { type: Number, required: true },
    payment_receipt: { type: String },
    payment_reference: { type: String },
    payment_account_details: {
        bank_name: { type: String, required: true },
        account_number: { type: String, required: true },
        account_name: { type: String, required: true },
    },
    total_bonus_earned: { type: Number, required: true },
    is_paid: { type: Boolean, default: false },
    paid_at: { type: Date },
    confirmed_at: { type: Date },
    payment_status: {
        type: String,
        enum: ["unpaid", "paid", "failed", "reversed"],
        default: "unpaid",
    },
    related_orders: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Order" }],
    period: {
        start_date: { type: Date, required: true },
        end_date: { type: Date, required: true },
    },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
exports.default = (0, mongoose_1.model)("Bonus", BonusSchema);
