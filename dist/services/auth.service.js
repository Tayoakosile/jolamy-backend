"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupService = void 0;
const User_1 = __importDefault(require("../models/User"));
const OfficeWorker_1 = __importDefault(require("../models/Admin/OfficeWorker"));
const response_1 = require("../utils/response");
const signupService = async (req, res) => {
    // TODO : Check if Email and Username is already registered
    const existingUser = await User_1.default.findOne({
        email: req.email,
        username: req?.username,
    });
    const existingOfficeWorker = await OfficeWorker_1.default.findOne({
        email: req.email,
        username: req?.username,
    });
    if (existingUser || existingOfficeWorker) {
        (0, response_1.errorResponse)(res, 400, "User with this email already exists");
    }
    const user = await User_1.default.create({
        ...req,
    });
    return user;
};
exports.signupService = signupService;
