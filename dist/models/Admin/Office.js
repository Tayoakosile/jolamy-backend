"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const officeSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    address: { type: String },
    created_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    is_active: { type: Boolean, default: true },
    transactions: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Finance",
        required: true,
    },
    workers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "OfficeWorker" }],
    logs: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Log" }],
    wallet: {
        office: { type: mongoose_1.Schema.Types.ObjectId, ref: "Office", required: true },
        balance: { type: Number, default: 0 },
        lastFundedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
        lastFundedAmount: { type: Number },
    },
}, { timestamps: true });
const Offices = (0, mongoose_1.model)("Office", officeSchema);
exports.default = Offices;
