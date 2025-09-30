"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBonuses = exports.verifyOrderCollectionOtp = exports.startOrderCollectionProcess = exports.getSingleDistributorDetails = exports.getAllDistributors = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const mongoose_1 = require("mongoose");
const Bonus_1 = __importDefault(require("../../models/Bonus"));
const Cart_1 = require("../../models/Cart");
const Product_1 = require("../../models/Product");
const SalesAgentOrders_1 = __importDefault(require("../../models/SalesAgentOrders"));
const User_1 = __importDefault(require("../../models/User"));
const mail_service_1 = require("../../services/mail.service");
const activityLog_1 = require("../../utils/activityLog");
const response_1 = require("../../utils/response");
const socket_1 = require("../../utils/socket");
const util_1 = require("../../utils/util");
const getAllDistributors = async (req, res) => {
    const distributors = await User_1.default.find({
        user_role: "distributor",
        status: "approved",
        is_verified: true,
        total_boxes_in_stock: { $gt: 0 },
    })
        .select(" -password -internal_sequence -__v -logs -transaction_history -is_admin -is_distributor -is_sales_agent -is_supervisor -is_warehouse_manager -is_worker -status -user_role -phone_number -distributor_location  -bvn -next_of_kin -total_boxes_sold -files -cart -registration_number -documents -paid_registration_fee -last_login  -approved_at -total_commission_earned -wallet -sales_agent_location -office -assigned_sales_agent")
        .populate({
        path: "stock_logs",
        populate: {
            path: "order", // 👈 name of the field in stock_log that references Order // pick the fields you need
            match: { delivery_status: "order_delivered" }, // optional: only successful orders
        },
        // select: "first_name last_name email worker_id user_id role",
    });
    (0, response_1.successResponse)(res, 200, "Distributors fetched successfully", {
        distributors: distributors || [],
    });
};
exports.getAllDistributors = getAllDistributors;
const getSingleDistributorDetails = async (req, res) => {
    const _req = req;
    const id = _req.params.id;
    await (0, util_1.checkIfDocumentExistsById)(id, "user_id", res, User_1.default);
    const singleUser = await User_1.default.findOne({
        user_id: id,
        user_role: "distributor",
        status: "approved",
        is_verified: true,
        total_boxes_in_stock: { $gt: 0 },
    }).populate({
        path: "stock_logs",
        populate: {
            path: "order", // 👈 name of the field in stock_log that references Order // pick the fields you need
            match: { delivery_status: "order_delivered" }, // optional: only successful orders
        },
    });
    (0, response_1.successResponse)(res, 200, "Distributor fetched successfully", {
        distributor: singleUser || {},
    });
};
exports.getSingleDistributorDetails = getSingleDistributorDetails;
const startOrderCollectionProcess = async (_req, res) => {
    const req = _req;
    const order = req.order;
    const salesAgentDetails = await User_1.default.findById(order?.user_id?._id).select("name email phone_number user_id");
    if (!order)
        return;
    const otp = (0, util_1.generateRandom)(6, "0");
    console.log("order?.collection_otp?.length  :", order, order?.collection_otp?.length, order?.collection_otp);
    const otpRecord = order?.collection_otp?.length >= 1 ? { code: order?.collection_otp } : null;
    const otpContainer = async (code) => {
        (0, socket_1.getIO)()
            .to(`${order?.user_id?._id}`)
            .emit("start_order_collection_process", {
            type: "otp",
            otp: code,
            order_id: order?._id,
        });
        await (0, mail_service_1.sendEmail)(salesAgentDetails?.email, "Order Collection OTP", `Your OTP for collecting order ${order?.internal_sequence} is: ${code}. It will expire in 10 minutes.`);
        (0, response_1.successResponse)(res, 200, "OTP already generated", {
            message: "OTP already generated",
        });
        return otp;
    };
    const hasOtpExpired = (0, dayjs_1.default)().isAfter((0, dayjs_1.default)(order?.collection_otp_expiry));
    console.log("hasOtpExpired :", hasOtpExpired);
    if (!otpRecord || hasOtpExpired) {
        await SalesAgentOrders_1.default.findOneAndUpdate({ order_number: order?.order_number }, {
            collection_otp: otp,
            collection_otp_expiry: (0, dayjs_1.default)().add(5, "minute").toDate(),
        });
        otpContainer(otp);
        return;
    }
    if (otpRecord?.code) {
        await SalesAgentOrders_1.default.findByIdAndUpdate(order?._id, {
            collection_otp: "",
            collection_otp_expiry: null,
        });
        otpContainer(otpRecord.code);
        return;
    }
    otpContainer(otp);
    return otp;
};
exports.startOrderCollectionProcess = startOrderCollectionProcess;
const verifyOrderCollectionOtp = async (_req, res) => {
    const req = _req;
    const order = req.order;
    const otp = req.query?.otp;
    const isOtpEqual = otp === req.order?.collection_otp;
    if (!isOtpEqual) {
        (0, response_1.errorResponse)(res, 400, "Invalid or incorrect code");
        return;
    }
    const bonus = await (0, exports.runBonuses)(res, order);
    // sales_agent
    await User_1.default.updateOne({ _id: order?.user_id?._id }, // condition
    {
        $inc: { total_boxes_in_stock: order.total_quantity },
        $push: {
            bonus: bonus?._id,
        },
    });
    await User_1.default.updateOne({ _id: order?.assigned_to?.distributor?._id }, // condition
    {
        $push: {
            bonus: bonus?._id,
        },
        $inc: {
            total_boxes_in_stock: order.total_quantity
                ? -order?.total_quantity
                : order?.assigned_to?.distributor?.total_boxes_in_stock,
        },
    } // increment by 5
    );
    let carts = await Cart_1.Cart.findOne({
        user: order?.user_id,
    });
    if (carts && carts?._id) {
        carts.items = (0, util_1.deleteCartComp)(order.products, carts);
        carts.save();
    }
    const salesAgentEmail = `Hi ${order?.user_id?.first_name},


Great news! The distributor has confirmed that your order has been successfully collected. We hope you enjoy your purchase. 🎁

If you encounter any issues with your items, please contact our support team immediately.

✨ In addition, you’ve earned a bonus for this order! You can check the Bonus Section in your account to view the details.

Thank you for choosing us,`;
    const distributorEmail = `Hello ${order?.assigned_to?.distributor?.name},

This is to confirm that the sales agent has successfully collected the order from your store. Thank you for your cooperation in ensuring a smooth pickup process.

If you notice any discrepancies or issues regarding this collection, kindly contact our support team immediately. Otherwise, no further action is required on your part.

We appreciate your continued partnership.
`;
    await (0, mail_service_1.sendEmail)(order?.user_id?.email, "Order Collected + Bonus Earned", salesAgentEmail);
    await (0, mail_service_1.sendEmail)(order?.assigned_to?.distributor?.email, "Order Collected + Bonus Earned", distributorEmail);
    const log = await (0, activityLog_1.logActivity)({
        req,
        user_id: order?.assigned_to?.distributor?._id,
        action: "Complete Order",
        description: "",
        sender: order?.assigned_to?.distributor?._id,
        receiver: new mongoose_1.Types.ObjectId(order?.user_id?._id),
    });
    await SalesAgentOrders_1.default.findByIdAndUpdate(order?._id, {
        status: "completed",
        $push: {
            delivery_steps: {
                label: "order_collected",
                date: new Date(),
                updated_by: {
                    type: "system",
                },
            },
            delivery_steps_logs: {
                label: "order_collected",
                date: new Date(),
                updated_by: {
                    type: "system",
                },
            },
            logs: log._id,
        },
        collection_otp: "",
        collection_otp_expiry: null,
        delivery_status: "order_collected",
    });
    (0, response_1.successResponse)(res, 200, "Order collection confirmed successfully", {
        message: "Order collection confirmed successfully",
    });
};
exports.verifyOrderCollectionOtp = verifyOrderCollectionOtp;
const runBonuses = async (res, order) => {
    try {
        const productsInOrder = order.products.map((p) => p.product_id); // extract ids
        // fetch all product details
        const products = await Product_1.Product.find({
            _id: { $in: productsInOrder },
        });
        const all_product_bonus = products.reduce((acc, item) => {
            acc.sales_agent_bonus_per_box += item.sales_agent_bonus_per_box || 0;
            acc.distributor_bonus_per_box += item.distributor_bonus_per_box || 0;
            return acc;
        }, { sales_agent_bonus_per_box: 0, distributor_bonus_per_box: 0 });
        const distributorInfo = order?.assigned_to?.distributor;
        const sales_agent_info = order?.user_id;
        const lastFriday = (0, dayjs_1.default)().day(5).subtract(1, "week").startOf("day");
        const thisThursday = (0, dayjs_1.default)().day(4).startOf("day");
        if (!order)
            return;
        // const allTransferRecipients = await JOL_Paystack_API.post(
        //   "/transferrecipient/bulk",
        //   JSON.stringify(paymentAccountDetails)
        // );
        // const paymentReferenceArray = allTransferRecipients?.data?.data?.success;
        const orderQuantity = order.total_quantity ?? 0;
        let update = {
            recipients: {
                distributor: order?.assigned_to?.distributor?._id,
                sales_agent: sales_agent_info?._id,
            },
            payment_account_details: {
                distributor: distributorInfo?.account_details,
                sales_agent: sales_agent_info?.account_details,
            },
            bonus_type: "sales_target",
            description: " Bonus for order " + order.order_number,
            no_of_boxes_sold: orderQuantity,
            total_bonus_earned: all_product_bonus,
            order: order?._id,
            total_amount: {
                distributor: all_product_bonus.distributor_bonus_per_box * orderQuantity,
                sales_agent: all_product_bonus.sales_agent_bonus_per_box * orderQuantity,
            },
            period: {
                start_date: lastFriday.toDate(),
                end_date: thisThursday.toDate(),
            },
        };
        const BonusReq = await Bonus_1.default.create(update);
        return BonusReq;
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 500, "Internal server error");
        console.log("error :", error);
    }
};
exports.runBonuses = runBonuses;
