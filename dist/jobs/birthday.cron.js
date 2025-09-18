"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const User_1 = __importDefault(require("../models/User"));
const dayjs_1 = __importDefault(require("dayjs"));
const mail_service_1 = require("../services/mail.service");
const Celebration_1 = require("../models/Celebration");
// Runs every Sunday at 11:59 PM
node_cron_1.default.schedule("*/1 * * * *", () => {
    console.log(" working on birthday update:");
    // call your bonus calculation service here
    const findUsersWithBirthdays = async () => {
        console.log(" working on birthday updatex2:");
        const today = (0, dayjs_1.default)().format("D").toString();
        const month = (0, dayjs_1.default)().format("M").toString();
        // Find users with birthdays today
        const users = await User_1.default.find({
            "dob.day": today,
            "dob.month": month,
            // is_active: true,
            is_verified: true,
            // user_role: { $ne: "admin" },
            status: "approved",
        }).select("first_name last_name email dob");
        users.forEach(async (user) => {
            const checkIfCelebrationModelExist = await Celebration_1.CelebrationModel.findOne({
                user_id: user?.id,
            });
            console.log("working on :", user?.first_name);
            console.log("user_id :", user?.id);
            if (!checkIfCelebrationModelExist) {
                const celebration = await Celebration_1.CelebrationModel.create({
                    user_id: user._id,
                    dob: {
                        day: today,
                        month,
                    },
                    type: "birthday",
                    date: new Date(),
                    message: `Happy Birthday, ${user.first_name}! Wishing you a wonderful year ahead.`,
                    title: "Happy Birthday!",
                    icon: "",
                });
                user.celebrations =
                    !user?.celebrations || user?.celebrations?.length <= 0
                        ? [celebration._id]
                        : [...user?.celebrations, celebration._id];
                user.save();
                (0, mail_service_1.sendEmail)(user?.email, "Happy Birthday!", `Dear ${user?.first_name},\n\nWishing you a fantastic birthday filled with joy and success!\n\nBest wishes,\nYour Company`);
                return;
            }
            if (checkIfCelebrationModelExist?.status !== "expired" &&
                (0, dayjs_1.default)(checkIfCelebrationModelExist.created_at).isAfter((0, dayjs_1.default)().add(1, "day"))) {
                console.log("updated :");
                checkIfCelebrationModelExist.status = "expired";
                checkIfCelebrationModelExist.save();
            }
        });
    };
    findUsersWithBirthdays();
});
