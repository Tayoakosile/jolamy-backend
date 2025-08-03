"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const ActivityLog_1 = require("../models/ActivityLog");
// src/utils/logActivity.ts
const logActivity = async ({ userId, action, description, ip, device, location, metadata, }) => {
    const log = await ActivityLog_1.ActivityLog.create({
        userId,
        action,
        description,
        ip,
        device,
        location,
        metadata,
    });
    return log;
};
exports.logActivity = logActivity;
