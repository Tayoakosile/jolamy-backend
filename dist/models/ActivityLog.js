"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLog = void 0;
// src/models/activityLog.model.ts
const mongoose_1 = __importDefault(require("mongoose"));
const util_1 = require("../utils/util");
const activityLogSchema = new mongoose_1.default.Schema({
    user_id: { type: mongoose_1.default.Types.ObjectId, ref: "User" },
    action: String,
    description: String,
    sender: { type: mongoose_1.default.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose_1.default.Types.ObjectId, ref: "User" },
    ip: String,
    device: String,
    location: String,
    metadata: Object,
}, {
    timestamps: {
        ...util_1.timestamp,
    },
});
exports.ActivityLog = mongoose_1.default.model("Log", activityLogSchema);
