"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const util_1 = require("../utils/util");
const counter_1 = require("./counter");
const ProductItemSchema = new mongoose_1.Schema({
    product_id: { type: mongoose_1.Types.ObjectId, ref: "Product", required: true },
    variants: [
        {
            id: { type: mongoose_1.Types.ObjectId, required: true },
            quantity: { type: Number, required: true },
            name: { type: String, required: true },
            total_boxes_in_stock: { type: Number, default: 0 },
            amount_per_box: { type: Number, required: false },
            total_amount: { type: Number, required: true },
        },
    ],
});
const DeliveryStepSchema = new mongoose_1.Schema({
    label: {
        type: String,
        enum: [
            "order_placed",
            "order_paid_for",
            "order_processing",
            "on_the_way",
            "order_delivered",
            "order_on_hold",
            "order_cancelled",
            "order_failed",
        ],
    },
    description: { type: String },
    is_confirmed: { type: Boolean, default: false },
    date: { type: Date },
    updated_by: {
        type: { type: String },
        name: { type: String },
        role: { type: String },
        id: { type: String },
        office_id: { type: String },
        office: { type: String },
    },
});
const SalesAgentOrderSchema = new mongoose_1.Schema({
    assigned_to: {
        distributor: { type: mongoose_1.Types.ObjectId, ref: "User", required: false },
    },
    user_id: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    priority_level: {
        type: String,
        enum: ["normal", "urgent"],
        default: "normal",
    },
    confirmation: {
        is_confirmed: { type: Boolean, default: false }, // final confirmation
        confirmed_at: { type: Date, default: null },
        auto_confirmed_at: { type: Date, default: null }, // when system should auto confirm
        method: { type: String, enum: ["user", "system"], default: "" }, // who confirmed
    },
    order_number: { type: String },
    date: { type: Date, default: Date.now },
    delivery_fee: { type: Number },
    delivery_steps: { type: [DeliveryStepSchema], required: true },
    delivery_steps_logs: { type: [DeliveryStepSchema], required: true },
    role: {
        type: String,
        enum: ["distributor", "sales_agent"],
        default: "sales_agent",
    },
    products: { type: [ProductItemSchema], required: true },
    payment_status: {
        type: String,
        enum: [
            "unpaid",
            "failed",
            "pending",
            "initiated",
            "paid",
            "manual_paid",
            "cancelled",
            "reversed",
            "abandoned",
        ],
        default: "initiated",
    },
    status: {
        type: String,
        enum: [
            "pending",
            "processing",
            "delivered",
            "completed",
            "cancelled",
            "failed",
            "refunded",
        ],
        default: "pending",
    },
    delivery_status: {
        type: String,
        enum: ["not_assigned", "pending", "in_transit", "delivered"],
        default: "not_assigned",
    },
    pickup: {
        date: { type: Date },
        distributor_id: { type: mongoose_1.Types.ObjectId, ref: "User" },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        // coordinates?: {
        //   // optional for map-based pickup
        //   lat: number;
        //   lng: number;
        // };
    },
    internal_notes: { type: String },
    admin_notes_to_customer: { type: String },
    internal_sequence: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 },
    grand_total: { type: Number, default: 0 }, // total_amount + delivery_fee
    total_quantity: { type: Number, default: 0 },
    estimated_delivery_date: {
        start: { type: Date },
        end: { type: Date },
    },
    actual_delivery_date: { type: Date },
    discount_amount: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    tracking_number: { type: String },
    courier_service: { type: String },
    cancelled_at: { type: Date },
    transaction_id: { type: mongoose_1.Types.ObjectId, ref: "Transaction" },
    refund_status: {
        type: String,
        enum: ["none", "pending", "processed"],
        default: "none",
    },
    fulfillment_type: {
        type: String,
        enum: ["delivery", "pickup"],
        default: "pickup",
    },
    payment_method: {
        type: String,
        enum: ["bank_transfer", "cash", "pos", "mobile_money", "paystack", null],
        default: null,
    },
    payment_reference: { type: String },
    logs: [{ type: mongoose_1.Types.ObjectId, ref: "Log" }],
}, { timestamps: { ...util_1.timestamp } });
SalesAgentOrderSchema.pre("save", async function (next) {
    if (this.isNew) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        // Increment sequence for today
        const counter = await counter_1.Counter.findOneAndUpdate({ name: "sales_agent_order", date: today }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
        const seq = counter.sequence;
        this.internal_sequence = seq;
        // Random 5-character alphanumeric
        const randomPart = (0, util_1.generateRandom)(8, "00").toUpperCase();
        const datePart = today.replace(/-/g, "");
        const order_number = `SAO-${datePart}-${randomPart}-${String(seq).padStart(4, "0")}`;
        this.order_number = order_number;
    }
    next();
});
const SalesAgentOrder = (0, mongoose_1.model)("SalesAgentOrder", SalesAgentOrderSchema);
exports.default = SalesAgentOrder;
