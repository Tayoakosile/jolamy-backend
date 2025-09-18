"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const node_cron_1 = __importDefault(require("node-cron"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const Bonus_1 = __importDefault(require("../models/Bonus"));
const isBetween_1 = __importDefault(require("dayjs/plugin/isBetween"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
dayjs_1.default.extend(isBetween_1.default);
dayjs_1.default.tz.setDefault("Africa/Lagos");
// Runs every Sunday at 11:59 PM
node_cron_1.default.schedule("*/1 * * * *", () => {
    console.log(" working on bonus update:");
    const timeZonedDayjs = dayjs_1.default.tz();
    // call your bonus calculation service here
    const calculateBonuses = async () => {
        const lastFriday = timeZonedDayjs.day(5).subtract(1, "week").startOf("day");
        const thisThursday = timeZonedDayjs.day(4).startOf("day");
        console.log("lastFriday :", lastFriday.format("YYYY-MM-DD"));
        console.log("thisThursday :", thisThursday.format());
        const pendingBonuses = await Bonus_1.default.find({
            status: "pending",
        });
        pendingBonuses.forEach((bonus) => {
            const startingPeriod = (0, dayjs_1.default)(bonus.period.start_date).isBetween(lastFriday, thisThursday, null, "[]");
            const endPeriod = (0, dayjs_1.default)(bonus.period.end_date).isBetween(lastFriday, thisThursday, null, "[]");
            // if (startingPeriod && endPeriod) {
            //   const transfer = await JOL_Paystack_API.get
            //   bonus.status = "due";
            //   bonus.save();
            //   console.log("Bonus marked as due for bonus_id:", bonus.bonus_id);
            // }
        });
        // console.log("pendingBonuses :", pendingBonuses);
    };
    calculateBonuses();
});
