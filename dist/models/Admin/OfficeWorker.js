"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficeWorker = void 0;
const mongoose_1 = require("mongoose");
const util_1 = require("../../utils/util");
const officeWorkerSchema = new mongoose_1.Schema({
    office: { type: mongoose_1.Schema.Types.ObjectId, ref: "Office", required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    employee_id: { type: String },
    role: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    is_deactivated: { type: Boolean, default: true },
    deactivated_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    added_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
}, {
    timestamps: {
        ...util_1.timestamp,
    },
});
exports.OfficeWorker = (0, mongoose_1.model)("OfficeWorker", officeWorkerSchema);
