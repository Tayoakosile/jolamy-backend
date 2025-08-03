"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLog = void 0;
// src/models/activityLog.model.ts
const mongoose_1 = __importDefault(require("mongoose"));
const activityLogSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Types.ObjectId, ref: "User" },
    action: String,
    description: String,
    ip: String,
    device: String,
    location: String,
    metadata: Object,
}, { timestamps: true });
exports.ActivityLog = mongoose_1.default.model("Logs", activityLogSchema);
