"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ProductItemSchema = new mongoose_1.Schema({
    product_id: { type: mongoose_1.Types.ObjectId, ref: "Product", required: true },
    variant_name: { type: String, required: true },
    weight: { type: String, required: true }, // e.g., "500g", "1kg"
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    total_price: { type: Number, required: true },
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
    order_id: { type: String, unique: true, required: true },
    user_id: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    assigned_to: { type: mongoose_1.Types.ObjectId, ref: "OfficeWorker", required: true },
    order_number: { type: String, unique: true, required: true },
    date: { type: Date, default: Date.now },
    delivery_fee: { type: Number, required: true },
    role: {
        type: String,
        enum: ["distributor", "sales_agent"],
        required: true,
    },
    products: { type: [ProductItemSchema], required: true },
    shipping_location: { type: ShippingLocationSchema, required: true },
    status: {
        type: String,
        enum: ["pending", "paid", "cancelled"],
        default: "pending",
    },
    delivery_status: {
        type: String,
        enum: ["not_assigned", "in_transit", "delivered", "pending"],
        default: "not_assigned",
    },
    internal_notes: { type: String },
    total_amount: { type: Number, required: true },
    payment_method: {
        type: String,
        enum: ["bank_transfer", "cash", "pos", "mobile_money", "paystack"],
    },
    payment_reference: { type: String },
    logs: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
    created_at: { type: Date, default: Date.now },
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)("Order", OrderSchema);
