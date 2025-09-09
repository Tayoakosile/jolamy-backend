"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSingleDistributorDetails = exports.getAllDistributors = void 0;
const response_1 = require("../../utils/response");
const User_1 = __importDefault(require("../../models/User"));
const util_1 = require("../../utils/util");
const getAllDistributors = async (req, res) => {
    const distributors = await User_1.default.find({
        user_role: "distributor",
        status: "approved",
        is_verified: true,
        total_boxes_in_stock: { $gt: 0 },
    }).select(" -password -internal_sequence -__v -logs -transaction_history -is_admin -is_distributor -is_sales_agent -is_supervisor -is_warehouse_manager -is_worker -status -user_role -phone_number -distributor_location  -bvn -next_of_kin -total_boxes_sold -files -cart -registration_number -documents -paid_registration_fee -last_login  -approved_at -total_commission_earned -wallet -sales_agent_location -office -assigned_sales_agent").populate({
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
