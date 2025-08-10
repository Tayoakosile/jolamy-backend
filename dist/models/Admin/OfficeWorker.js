"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficeWorker = void 0;
const mongoose_1 = require("mongoose");
const util_1 = require("../../utils/util");
const bcrypt_util_1 = require("../../utils/bcrypt.util");
const counter_1 = require("../counter");
const officeWorkerSchema = new mongoose_1.Schema({
    office: { type: mongoose_1.Schema.Types.ObjectId, ref: "Office", required: true },
    employee_id: { type: String },
    role: { type: String, required: true },
    internal_sequence: { type: Number, default: 0 },
    worker_id: { type: String, unique: true },
    is_active: { type: Boolean, default: true },
    last_login: { type: Date },
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
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, {
    timestamps: {
        ...util_1.timestamp,
    },
});
officeWorkerSchema.virtual("fullName").get(function () {
    return `${this.first_name} ${this.last_name}`;
});
officeWorkerSchema.virtual("is_first_login").get(function () {
    return this.last_login ? false : true;
});
officeWorkerSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    this.password = await (0, bcrypt_util_1.encrypt)(this.password);
    next();
});
officeWorkerSchema.pre("save", async function (next) {
    if (this.isNew) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        // Increment sequence for today
        const counter = await counter_1.Counter.findOneAndUpdate({ name: "worker", date: today }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
        const seq = counter.sequence;
        this.internal_sequence = seq;
        // Random 5-character alphanumeric
        const randomPart = (0, util_1.generateRandom)(8, "0A").toUpperCase();
        const datePart = today.replace(/-/g, "");
        const user_id = `WRK-${datePart}-${randomPart}-${String(seq).padStart(4, "0")}`;
        this.worker_id = user_id;
    }
    next();
});
exports.OfficeWorker = (0, mongoose_1.model)("OfficeWorker", officeWorkerSchema);
