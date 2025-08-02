"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupService = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const signupService = async (name, email, password) => {
    const existingUser = await user_model_1.default.findOne({ email });
    if (existingUser)
        throw new Error('Email already in use');
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = await user_model_1.default.create({
        name,
        email,
        password: hashedPassword,
    });
    return user;
};
exports.signupService = signupService;
