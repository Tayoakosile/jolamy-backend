"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationReadStatus = exports.getNotifications = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const response_1 = require("../utils/response");
const isBetween_1 = __importDefault(require("dayjs/plugin/isBetween"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const Notification_1 = __importDefault(require("../models/Notification"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
dayjs_1.default.extend(isBetween_1.default);
dayjs_1.default.tz.setDefault("Africa/Lagos");
const getNotifications = async (req, res) => {
    try {
        const _req = req;
        const notifications = await Notification_1.default.find({
            user: _req.user?._id,
        }).sort({ created_at: -1 });
        (0, response_1.successResponse)(res, 200, "notifications_fetched_successfully", {
            notifications: notifications || [],
        });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
    }
};
exports.getNotifications = getNotifications;
const updateNotificationReadStatus = async (req, res) => {
    try {
        const _req = req;
        const param = _req.params.id;
        await Notification_1.default.findOneAndUpdate({
            notification_id: param,
            user_id: _req.user?._id,
        }, {
            read_at: new Date(),
            is_read: true,
        });
        (0, response_1.successResponse)(res, 200, "notification_updated_successfully", {
            notification_id: param,
        });
    }
    catch (error) { }
};
exports.updateNotificationReadStatus = updateNotificationReadStatus;
