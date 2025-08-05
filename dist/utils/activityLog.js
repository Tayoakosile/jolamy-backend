"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const ActivityLog_1 = require("../models/ActivityLog");
// src/utils/logActivity.ts
const logActivity = async ({ req, user_id, action, description, sender, receiver, metadata, }) => {
    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0]?.trim() ||
        req.socket.remoteAddress;
    const location = req.headers["x-location"] || "Unknown Location";
    const log = await ActivityLog_1.ActivityLog.create({
        user_id,
        action,
        description,
        ip,
        sender,
        receiver,
        device: req.headers["user-agent"],
        location,
        // location field removed as it is not defined
        metadata,
    });
    return log;
};
exports.logActivity = logActivity;
