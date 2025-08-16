"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficeFinanceLog = exports.OfficeWallet = void 0;
const mongoose_1 = require("mongoose");
const util_1 = require("../utils/util");
const walletSchema = new mongoose_1.Schema({
    office: { type: mongoose_1.Schema.Types.ObjectId, ref: "Office", required: true },
    balance: { type: Number, default: 0 },
    lastFundedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    lastFundedAmount: { type: Number },
}, {
    timestamps: {
        ...util_1.timestamp,
    },
});
exports.OfficeWallet = (0, mongoose_1.model)("OfficeWallet", walletSchema);
const financeLogSchema = new mongoose_1.Schema({
    office: { type: mongoose_1.Schema.Types.ObjectId, ref: "Office", required: true },
    type: {
        type: String,
        enum: ["inflow", "outflow", "transaction-in", "transaction-out"],
        required: true,
    },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String },
    reference: { type: String },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
}, {
    timestamps: {
        ...util_1.timestamp,
    },
});
exports.OfficeFinanceLog = (0, mongoose_1.model)("OfficeFinanceLog", financeLogSchema);
