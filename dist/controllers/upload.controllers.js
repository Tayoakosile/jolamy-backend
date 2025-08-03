"use strict";
// src/controllers/upload.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const upload_1 = require("../utils/upload");
const path_1 = __importDefault(require("path"));
const jwt_1 = require("../utils/jwt");
const uploadImage = async (req, res) => {
    try {
        console.log("req :", req.body);
        const files = req.files;
        const urls = [];
        console.log("generateToken() :", (0, jwt_1.generateToken)("hello_world", process.env.EMAIL_SECRET));
        for (const file of files) {
            const fullPath = path_1.default.join(process.cwd(), file.path);
            const fileUrl = await (0, upload_1.uploadFileToBytescale)(fullPath, file.originalname, file.mimetype);
            urls.push(fileUrl);
        }
        console.log("urls :", urls);
    }
    catch (error) {
        res.status(500).json({
            message: "Upload failed",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.uploadImage = uploadImage;
