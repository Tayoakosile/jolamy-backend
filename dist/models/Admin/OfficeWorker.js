"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficeWorker = void 0;
const mongoose_1 = require("mongoose");
const util_1 = require("../../utils/util");
const bcrypt_util_1 = require("../../utils/bcrypt.util");
const officeWorkerSchema = new mongoose_1.Schema({
    office: { type: mongoose_1.Schema.Types.ObjectId, ref: "Office", required: true },
    employee_id: { type: String },
    role: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    is_deactivated: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    deactivated_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    added_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    logs: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Log" }],
    cash_flow: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "CashFlow" }], // Reference to cash flow model
    orders_in_charge: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Order" }],
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true, },
    password: { type: String, required: true },
}, {
    timestamps: {
        ...util_1.timestamp,
    },
});
officeWorkerSchema.virtual("fullName").get(function () {
    return `${this.first_name} ${this.last_name}`;
});
officeWorkerSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    this.password = await (0, bcrypt_util_1.encrypt)(this.password);
    next();
});
exports.OfficeWorker = (0, mongoose_1.model)("OfficeWorker", officeWorkerSchema);
