"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const util_1 = require("../utils/util");
const getAllOrders = (_req, res) => {
    const id = _req.user?._id;
    const request = async () => {
        return await Order_1.default.find({ user_id: id });
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Orders retrieved successfully",
        errorMessage: "Error retrieving orders",
        statusCode: 200,
    });
};
exports.getAllOrders = getAllOrders;
