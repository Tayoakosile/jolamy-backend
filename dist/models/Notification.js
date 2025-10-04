"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const util_1 = require("../utils/util");
const counter_1 = require("./counter");
const NotificationSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: String,
    internal_sequence: { type: Number, immutable: true },
    message: String,
    notification_id: String,
    read_at: Date,
    type: String, // e.g. "order", "promo", "system"
    link: String, // where to redirect when clicked
    is_read: { type: Boolean, default: false }, // read/unread flag
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
NotificationSchema.pre("save", async function (next) {
    if (this.isNew) {
        const today = new Date().toISOString().split("T")[0];
        // Increment sequence for today
        const counter = await counter_1.Counter.findOneAndUpdate({ name: "notification", date: today }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
        const seq = counter.sequence;
        this.internal_sequence = seq;
        // Random 5-character alphanumeric
        const randomPart = (0, util_1.generateRandom)(8, "00").toUpperCase();
        const datePart = today.replace(/-/g, "");
        const bonus_number = `NOT-${datePart}-${randomPart}-${String(seq).padStart(4, "0")}`;
        this.notification_id = bonus_number;
    }
    next();
});
exports.default = (0, mongoose_1.model)("Notification", NotificationSchema);
