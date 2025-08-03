"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const ActivityLog_1 = require("../models/ActivityLog");
// src/utils/logActivity.ts
const logActivity = async ({ req, userId, action, description, metadata, }) => {
    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0]?.trim() ||
        req.socket.remoteAddress;
    const log = await ActivityLog_1.ActivityLog.create({
        userId,
        action,
        description,
        ip,
        device: req.headers["user-agent"],
        location,
        metadata,
    });
    return log;
};
exports.logActivity = logActivity;
