"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PricingSchema = new mongoose_1.Schema({
    distributor_price_per_box: { type: Number, required: true },
    profit_per_box: { type: Number, required: true },
    first_time_min_order_qty: { type: Number, required: true },
    next_order_min_qty: { type: Number }, // optional for sales agent
    sales_agent_price_per_unit: { type: Number },
    bonus_per_box: { type: Number },
}, { _id: false });
const VariantSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    inventory_alert_threshold: { type: Number, required: true },
    units_per_box: { type: Number, required: true },
    total_boxes_in_stock: { type: Number, default: null }, // null means unlimited
    unit_type: { type: String, required: true },
    distributor_pricing: {
        price_per_box: { type: Number, required: true },
        profit_per_box: { type: Number, required: true },
        first_time_min_order_qty: { type: Number, default: 150 },
    },
    sales_agent_pricing: {
        price_per_unit: { type: Number },
        price_per_box: { type: Number },
        bonus_per_box: { type: Number, required: true },
        first_time_min_order_qty: { type: Number },
        //   next_order_min_qty: { type: Number, required: true },
    },
}, { _id: false });
const ProductSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: String,
    category: String,
    reference_id: String,
    product_images: { type: Array, required: true },
    available_weight: [{ type: String, required: true }], // e.g., '500g', '1kg'
    is_active: { type: Boolean, default: true },
    is_archived: { type: Boolean, default: false }, // added for archiving products
    archived_at: { type: Date }, // optional field to track when the product was archived
    archived_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" }, // reference to the admin who archived the product
    variants: [VariantSchema],
    logs: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Log" }],
    inventory: [
        {
            variant: {
                type: String,
                required: true,
            },
            in_stock: { type: Number, required: true },
            total_sold: { type: Number, default: 0 },
            min_threshold: { type: Number, default: 0 },
            sold_this_month: { type: Number, default: 0 },
        },
    ],
    orders: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Order" }],
    created_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
exports.Product = mongoose_1.default.model("Product", ProductSchema);
