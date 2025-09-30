"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const node_cron_1 = __importDefault(require("node-cron"));
const Bonus_1 = __importDefault(require("../models/Bonus"));
const isBetween_1 = __importDefault(require("dayjs/plugin/isBetween"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
dayjs_1.default.extend(isBetween_1.default);
dayjs_1.default.tz.setDefault("Africa/Lagos");
// Runs every Sunday at 11:59 PM
node_cron_1.default.schedule("*/1 * * * *", () => {
    // console.log(" working on bonus update:");
    const timeZonedDayjs = dayjs_1.default.tz();
    // call your bonus calculation service here
    const calculateBonuses = async () => {
        const lastFriday = timeZonedDayjs.day(5).subtract(1, "week").startOf("day");
        const thisThursday = timeZonedDayjs.day(4).startOf("day");
        // console.log("lastFriday :", lastFriday.format("YYYY-MM-DD"));
        // console.log("thisThursday :", thisThursday.format());
        console.log("bonuses :");
        const pendingBonuses = await Bonus_1.default.find({
            payment_status: {
                distributor: "unpaid",
                sales_agent: "unpaid",
            },
        });
        console.log("pendingBonuses :", pendingBonuses);
        pendingBonuses.forEach(async (bonus) => {
            const distributor_reference = `acv_${bonus.bonus_id}_${Date.now()}_${bonus.recipients.distributor}`;
            const sales_agent_reference = `acv_${bonus.bonus_id}_${Date.now()}_${bonus.recipients.distributor}`;
            const paymentBatchDetails = {
                currency: "NGN",
                source: "balance",
                transfers: [
                    {
                        amount: bonus.total_amount.distributor * 100,
                        reason: " Bonus Payment - Distributor",
                        reference: distributor_reference,
                        recipient: bonus.payment_account_details?.distributor
                            .paystack_payment_reference,
                    },
                    {
                        amount: bonus.total_amount.sales_agent * 100,
                        reason: " Bonus Payment - Sales Agent",
                        reference: sales_agent_reference,
                        recipient: bonus.payment_account_details?.sales_agent
                            .paystack_payment_reference,
                    },
                ],
            };
            // const makePayment = await JOL_Paystack_API.post(
            //   "/transfer/bulk",
            //   paymentBatchDetails
            // );
            // console.log("makePayment :", makePayment.data);
            const startingPeriod = (0, dayjs_1.default)(bonus.period.start_date).isBetween(lastFriday, thisThursday, null, "[]");
            const endPeriod = (0, dayjs_1.default)(bonus.period.end_date).isBetween(lastFriday, thisThursday, null, "[]");
            // const paymentDetails = {
            //   source: "balance",
            // reason: "Bonus Payment",
            //   amount: 100000,
            //   recipient: "RCP_gd9vgag7n5lr5ix",
            //   reference: "acv_9ee55786-2323-4760-98e2-6380c9cb3f68",
            // };
            // {
            //   "amount": 15000,
            //   "reference": "acv_11bebfc3-18b3-40aa-a4df-c55068c93457",
            //   "reason": "Bonus for the week",
            //   "recipient": "RCP_dfznnod8rwxlwgn"
            // }
            if (startingPeriod && endPeriod) {
                console.log(" startingPeriond:");
                // const transfer = await JOL_Paystack_API.get
                // bonus.status = "due";
                // bonus.save();
                // console.log("Bonus marked as due for bonus_id:", bonus.bonus_id);
            }
        });
        // console.log("pendingBonuses :", pendingBonuses);
    };
    calculateBonuses();
});
