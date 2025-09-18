"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CelebrationModel = void 0;
const mongoose_1 = require("mongoose");
const util_1 = require("../utils/util");
const CelebrationSchema = new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    dob: {
        day: { type: Number, required: true },
        month: { type: Number, required: true },
    },
    status: { type: String },
    type: {
        type: String,
        enum: [
            "birthday",
            "anniversary",
            "first_purchase",
            "first_bonus",
            "milestone",
            "rank",
        ],
        required: true,
    },
    title: { type: String, required: true },
    message: { type: String },
    icon: { type: String },
    animation: { type: String },
    meta: { type: mongoose_1.Schema.Types.Mixed }, // flexible for extra info
    is_seen: { type: Boolean, default: false },
}, { timestamps: { ...util_1.timestamp } });
exports.CelebrationModel = (0, mongoose_1.model)("Celebration", CelebrationSchema);
