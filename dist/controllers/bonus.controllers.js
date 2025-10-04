"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBonusPayment = exports.getSingleBonus = exports.getBonuses = exports.runBonuses = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const Bonus_1 = __importDefault(require("../models/Bonus"));
const Product_1 = require("../models/Product");
const SalesAgentOrders_1 = __importDefault(require("../models/SalesAgentOrders"));
const response_1 = require("../utils/response");
const util_1 = require("../utils/util");
const isBetween_1 = __importDefault(require("dayjs/plugin/isBetween"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
dayjs_1.default.extend(isBetween_1.default);
dayjs_1.default.tz.setDefault("Africa/Lagos");
const runBonuses = async () => {
    try {
        const products = await Product_1.Product.find({});
        const orders = await SalesAgentOrders_1.default.find()
            .populate("assigned_to.distributor")
            .populate("user_id");
        const order = orders[orders?.length - 1];
        const distributorInfo = order?.assigned_to?.distributor;
        const sales_agent_info = order?.user_id;
        const product = products[products?.length - 1];
        const lastFriday = (0, dayjs_1.default)().day(5).subtract(1, "week").startOf("day");
        const thisThursday = (0, dayjs_1.default)().day(4).startOf("day");
        // Output
        console.log("Last Friday:", lastFriday.format("YYYY-MM-DD"));
        console.log("This Thursday:", thisThursday.format("YYYY-MM-DD"));
        console.log("sales_agent_info", sales_agent_info);
        //   console.log("distributorInfo :", distributorInfo);
        //   ({
        //     "type": "nuban",
        //     "name": "Tolu Robert",
        //     "account_number": "01000000010",
        //     "bank_code": "058",
        //     "currency": "NGN"
        //   })
        // console.log("distributorInfo :", distributorInfo);
        // return;
        const paymentAccountDetails = {
            batch: [
                {
                    type: "nuban",
                    name: " Oluwatayo Samuel Akosile ",
                    account_number: "8126741053",
                    bank_code: "044",
                    //   bank_code: "999992",
                    currency: "NGN",
                    metadata: {
                        user_id: distributorInfo?.user_id,
                        email: distributorInfo?.email,
                        name: `${distributorInfo?.first_name} ${distributorInfo?.last_name}`,
                        phone: distributorInfo?.phone_number,
                        role: distributorInfo?.user_role,
                    },
                },
                {
                    type: "nuban",
                    name: `${sales_agent_info?.first_name} ${sales_agent_info?.last_name}`,
                    account_number: "8126741053",
                    bank_code: "058",
                    //   bank_code: "058",
                    currency: "NGN",
                },
            ],
        };
        if (!order)
            return;
        // console.log('paymentAccountDetails :', paymentAccountDetails);
        const orderQuantity = order.total_quantity ?? 0;
        const distributor_bonus_per_box = product.distributor_bonus_per_box;
        const sales_agent_bonus_per_box = product.sales_agent_bonus_per_box;
        let update = {
            recipients: {
                distributor: order?.assigned_to?.distributor?._id,
                sales_agent: order?.user_id,
            },
            payment_account_details: {
                distributor: {
                    bank_name: "Guaranty Trust Bank",
                    account_number: "0123456789",
                    account_name: "Jolamy Distributors Ltd",
                },
                sales_agent: {
                    bank_name: "Guaranty Trust Bank",
                    account_number: "0123456789",
                    account_name: "Jolamy Distributors Ltd",
                },
            },
            total_bonus_earned: {
                distributor: distributor_bonus_per_box * orderQuantity,
                sales_agent: sales_agent_bonus_per_box * orderQuantity,
            },
            bonus_type: "sales_target",
            role: distributorInfo?.user_role,
            description: " Bonus for order " + order.order_number,
            no_of_boxes_sold: orderQuantity,
            bonus_per_box: distributor_bonus_per_box,
            total_amount: {
                distributor: distributor_bonus_per_box * orderQuantity,
                sales_agent: sales_agent_bonus_per_box * orderQuantity,
            },
            period: {
                start_date: lastFriday.toDate(),
                end_date: thisThursday.toDate(),
            },
        };
        const BonusReq = await Bonus_1.default.create(update);
        console.log("BonusReq :", BonusReq);
    }
    catch (error) {
        console.log("error :", error?.response.data);
    }
};
exports.runBonuses = runBonuses;
const getBonuses = async (req, res) => {
    const _req = req;
    const user = _req?.user;
    const user_id = user?.id;
    const bonuses = user?.is_admin
        ? await Bonus_1.default.find({})
            .populate({
            path: "recipients.distributor",
            select: "first_name last_name email phone_number user_role",
        })
            .populate({
            path: "recipients.sales_agent",
            select: "first_name last_name email phone_number user_role",
        })
        : await Bonus_1.default.find({
            $or: [
                { "recipients.distributor": user_id },
                { "recipients.sales_agent": user_id },
            ],
        })
            .populate({
            path: "recipients.distributor",
            select: "first_name last_name email phone_number user_role",
        })
            .populate({
            path: "recipients.sales_agent",
            select: "first_name last_name email phone_number user_role",
        });
    (0, response_1.successResponse)(res, 200, "bonuses_fetched_successfully", { bonuses });
};
exports.getBonuses = getBonuses;
const getSingleBonus = async (req, res) => {
    try {
        const _req = req;
        const param = _req.params.id;
        const user_id = _req.user?._id;
        const bonus = await Bonus_1.default.findOne({
            bonus_id: param,
            $or: [
                { "recipients.distributor": user_id },
                { "recipients.sales_agent": user_id },
            ],
        })
            .populate({
            path: "recipients.distributor",
            select: "first_name last_name email phone_number user_role",
        })
            .populate({
            path: "recipients.sales_agent",
            select: "first_name last_name email phone_number user_role",
        });
        if (!bonus)
            return;
        const updatedBonus = _req.user?.is_distributor
            ? {
                ...bonus.toObject(),
                user: bonus?.recipients?.distributor,
                is_paid: bonus?.is_paid?.distributor || false,
                total_bonus_earned: bonus?.total_bonus_earned?.distributor_bonus_per_box || 0,
                total_amount: bonus?.total_amount?.distributor || 0,
                payment_status: bonus?.payment_status?.distributor || "pending",
                period: `${bonus?.period?.start_date?.toDateString()} - ${bonus?.period?.end_date?.toDateString()}`,
                payment_confirmed: bonus?.payment_confirmed?.distributor || false,
            }
            : {
                ...bonus.toObject(),
                user: bonus?.recipients?.sales_agent,
                is_paid: bonus?.is_paid?.sales_agent || false,
                payment_confirmed: bonus?.payment_confirmed?.sales_agent || false,
                total_bonus_earned: bonus?.total_bonus_earned?.sales_agent_bonus_per_box || 0,
                total_amount: bonus?.total_amount?.sales_agent || 0,
                payment_status: bonus?.payment_status?.sales_agent || "pending",
                // period: `${bonus?.period?.start_date?.toDateString()} - ${bonus?.period?.end_date?.toDateString()}`,
            };
        const { recipients, ...rest } = updatedBonus;
        (0, response_1.successResponse)(res, 200, "bonus_fetched_sucessfully", {
            bonus: rest,
        });
    }
    catch (error) { }
};
exports.getSingleBonus = getSingleBonus;
const runBonusPayment = () => {
    // console.log(" working on bonus update:");
    const timeZonedDayjs = (0, dayjs_1.default)().tz();
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
        // console.log("pendingBonuses :", pendingBonuses.length);
        const result = [];
        const transactions = pendingBonuses
            .map((bonus) => {
            const distributor_reference = `acv_${bonus.bonus_id}_${(0, util_1.generateRandom)()}_${bonus.recipients.distributor}`;
            const sales_agent_reference = `acv_${bonus.bonus_id}_${(0, util_1.generateRandom)()}_${bonus.recipients.distributor}`;
            const paymentBatchDetails = [
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
            ];
            console.log("paymentBatchDetails :", paymentBatchDetails);
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
            return paymentBatchDetails;
            if (startingPeriod && endPeriod) {
                // const transfer = await JOL_Paystack_API.get
                // bonus.status = "due";
                // bonus.save();
                // console.log("Bonus marked as due for bonus_id:", bonus.bonus_id);
            }
        })
            .flat()
            .forEach((item) => {
            const existing = result.find((r) => r.recipient === item.recipient);
            if (existing) {
                existing.amount += item.amount; // update the amount if recipient already exists
            }
            else {
                result.push({ ...item }); // otherwise insert it fresh
            }
        });
        console.log("result :", result);
        return;
    };
    calculateBonuses();
};
exports.runBonusPayment = runBonusPayment;
