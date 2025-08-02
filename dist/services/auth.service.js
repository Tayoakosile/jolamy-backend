"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupService = void 0;
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const signupService = async (req, password) => {
    const existingUser = await User_1.default.findOne({ email: req.email });
    if (existingUser) {
        throw new Error("Email already in use");
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = await User_1.default.create({
        ...req,
        password: hashedPassword,
    });
    return user;
};
exports.signupService = signupService;
