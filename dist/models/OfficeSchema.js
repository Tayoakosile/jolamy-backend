"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Office = void 0;
const mongoose_1 = require("mongoose");
const officeSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    address: { type: String },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    transactions: { type: mongoose_1.Schema.Types.ObjectId, ref: "Finance", required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
exports.Office = (0, mongoose_1.model)("Office", officeSchema);
