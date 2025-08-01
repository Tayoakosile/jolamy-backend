"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.createUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const createUser = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User_1.default.create({ name, email });
        res.status(201).json(user);
    }
    catch (error) {
        res.status(400).json({ error: "User creation failed" });
    }
};
exports.createUser = createUser;
const getUsers = async (_, res) => {
    res.json("yooo");
};
exports.getUsers = getUsers;
