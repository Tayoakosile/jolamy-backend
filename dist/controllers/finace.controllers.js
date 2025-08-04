"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFinance = void 0;
const CashFlow_1 = __importDefault(require("../models/CashFlow"));
const util_1 = require("../utils/util");
const getAllFinance = (req, res) => {
    console.log('req :', req);
    const request = async () => {
        return await CashFlow_1.default.find();
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Finance records retrieved successfully",
        errorMessage: "Error retrieving finance records",
        statusCode: 200,
    });
};
exports.getAllFinance = getAllFinance;
