"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
/** @type {*} */
const financeSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ["inflow", "outflow"],
        required: true,
    },
    amount: { type: Number, required: true },
    office_id: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    payment_method: { type: String, trim: true },
    attachments: { type: [] },
    category: { type: String, required: true, trim: true },
    description: { type: String },
    notes: { type: String },
    status: { type: String },
    reference: { type: String },
    created_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)("Finance", financeSchema);
