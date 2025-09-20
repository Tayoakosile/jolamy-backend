"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOrderCollectionProcess = exports.getSingleDistributorDetails = exports.getAllDistributors = void 0;
const User_1 = __importDefault(require("../../models/User"));
const response_1 = require("../../utils/response");
const socket_1 = require("../../utils/socket");
const util_1 = require("../../utils/util");
const Otp_1 = __importDefault(require("../../models/Otp"));
const mail_service_1 = require("../../services/mail.service");
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
    const salesAgentDetails = await User_1.default.findById(order?.user_id).select("name email phone_number user_id");
    const otp = (0, util_1.generateRandom)(6, "0");
    const otpRecord = await Otp_1.default.findOne({
        email: salesAgentDetails?.email,
        type: "order_collection",
        // expires_at: { $gt: new Date() },
    });
    console.log("otpRecord :", otpRecord, salesAgentDetails?.email);
    const otpContainer = async (code) => {
        (0, socket_1.getIO)()
            .to(`${order?.assigned_to?.distributor}`)
            .emit("start_order_collection_process", {
            type: "otp",
            order_id: order?._id,
        });
        (0, socket_1.getIO)()
            .to(`${order?.user_id?._id}`)
            .emit("start_order_collection_process", {
            type: "otp",
            otp: code,
            order_id: order?._id,
        });
        await (0, mail_service_1.sendEmail)(salesAgentDetails?.email, "Order Collection OTP", `Your OTP for collecting order ${order?.internal_sequence} is: ${code}. It will expire in 10 minutes.`);
        return otp;
    };
    if (otpRecord) {
        otpContainer(otpRecord.code);
        return;
    }
    await Otp_1.default.create({
        email: salesAgentDetails?.email,
        code: otp,
        type: "order_collection",
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
    });
    otpContainer(otp);
};
exports.startOrderCollectionProcess = startOrderCollectionProcess;
