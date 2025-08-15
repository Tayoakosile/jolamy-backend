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
const mongoose_1 = __importStar(require("mongoose"));
const counter_1 = require("./counter");
const util_1 = require("../utils/util");
// const PricingSchema = new Schema<Pricing>(
//   {
//     distributor_price_per_box: { type: Number, required: true },
//     profit_per_box: { type: Number, required: true },
//     first_time_min_order_qty: { type: Number, required: true },
//     next_order_min_qty: { type: Number }, // optional for sales agent
//     sales_agent_price_per_unit: { type: Number },
//     bonus_per_box: { type: Number },
//   },
//   { _id: false }
// );
const TransactionSchema = new mongoose_1.Schema({
    transaction_id: { type: String, immutable: true },
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    user_role: {
        type: String,
        enum: ["admin", "distributor", "sales_agent"],
        required: true,
    },
    date: { type: Date, default: Date.now },
    internal_sequence: { type: Number, default: 0 },
    office_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "Office" },
    order_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order" },
    transaction_type: {
        type: String,
        enum: ["credit", "debit"],
        required: true,
    },
    category: {
        type: String,
        enum: ["wallet_funding", "order_payment", "bonus_settlement", "other"],
        required: true,
    },
    description: { type: String },
    total: { type: Number, required: true, min: 0 },
    // balance_after: { type: Number, required: true, min: 0 },
    payment_method: {
        type: String,
        enum: ["cash", "bank_transfer", "pos", "wallet", "other"],
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed", "cancelled"],
        default: "pending",
    },
}, { timestamps: true });
TransactionSchema.pre("save", async function (next) {
    if (this.isNew) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        // Increment sequence for today
        const counter = await counter_1.Counter.findOneAndUpdate({ name: "transaction", date: today }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
        const seq = counter.sequence;
        this.internal_sequence = seq;
        // Random 5-character alphanumeric
        const randomPart = (0, util_1.generateRandom)(8, "0A").toUpperCase();
        const datePart = today.replace(/-/g, "");
        const transaction_id = `TRX-${datePart}-${randomPart}-${String(seq).padStart(4, "0")}`;
        this.transaction_id = transaction_id;
    }
    next();
});
TransactionSchema.pre("save", async function (next) {
    if (this.isNew) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        // Increment sequence for today
        const counter = await counter_1.Counter.findOneAndUpdate({ name: "order", date: today }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
        const seq = counter.sequence;
        this.internal_sequence = seq;
        // Random 5-character alphanumeric
        const randomPart = (0, util_1.generateRandom)(8, "00").toUpperCase();
        const datePart = today.replace(/-/g, "");
        const transaction_id = `ORD-${datePart}-${randomPart}-${String(seq).padStart(4, "0")}`;
        this.transaction_id = transaction_id;
    }
    next();
});
const Transaction = mongoose_1.default.model("Transaction", TransactionSchema);
exports.default = Transaction;
