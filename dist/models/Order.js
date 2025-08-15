"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const counter_1 = require("./counter");
const util_1 = require("../utils/util");
const ProductItemSchema = new mongoose_1.Schema({
    variants: [
        {
            id: { type: mongoose_1.Types.ObjectId },
            quantity: { type: Number, required: true },
            name: { type: String, required: true },
            total_boxes_in_stock: { type: Number, default: 0 },
            amount_per_box: { type: Number, required: false },
            total_amount: { type: Number, required: true },
        },
    ],
}, { _id: false });
const ShippingLocationSchema = new mongoose_1.Schema({
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    estimatedDate: { type: Date, required: true },
}, { _id: false });
const OrderSchema = new mongoose_1.Schema({
    assigned_to: {
        office: { type: mongoose_1.Types.ObjectId, ref: "Office", required: false },
        office_worker: {
            type: mongoose_1.Types.ObjectId,
            ref: "OfficeWorker",
            required: false,
        },
    },
    user_id: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    order_number: { type: String },
    date: { type: Date, default: Date.now },
    delivery_fee: { type: Number },
    role: {
        type: String,
        enum: ["distributor", "sales_agent"],
        required: true,
    },
    products: { type: [ProductItemSchema], required: true },
    shipping_location: {
        type: ShippingLocationSchema,
    },
    payment_status: {
        type: String,
        enum: [
            "unpaid",
            "failed",
            "pending",
            "initiated",
            "paid",
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
    internal_notes: { type: String },
    admin_notes_to_office: { type: String },
    admin_notes_to_customer: { type: String },
    internal_sequence: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 },
    total_quantity: { type: Number, default: 0 },
    estimated_delivery_date: { type: Date },
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
        // enum: ["delivery", "pickup"],
        default: "",
    },
    payment_method: {
        type: String,
        enum: ["bank_transfer", "cash", "pos", "mobile_money", "paystack", null],
        default: null,
    },
    payment_reference: { type: String },
    logs: [{ type: mongoose_1.Types.ObjectId, ref: "Log" }],
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});
OrderSchema.pre("save", async function (next) {
    if (this.isNew) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        // Increment sequence for today
        const counter = await counter_1.Counter.findOneAndUpdate({ name: "order", date: today }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
        const seq = counter.sequence;
        this.internal_sequence = seq;
        // Random 5-character alphanumeric
        const randomPart = (0, util_1.generateRandom)(8, "00").toUpperCase();
        const datePart = today.replace(/-/g, "");
        const order_number = `ORD-${datePart}-${randomPart}-${String(seq).padStart(4, "0")}`;
        this.order_number = order_number;
    }
    next();
});
const Order = (0, mongoose_1.model)("Order", OrderSchema);
exports.default = Order;
