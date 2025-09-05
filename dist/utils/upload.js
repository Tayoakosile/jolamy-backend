"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.generateUniqueFileName = exports.uploadFileToBytescale = void 0;
// src/utils/uploadToBytescale.ts
const uuid_1 = require("uuid");
const Bytescale = __importStar(require("@bytescale/sdk"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
dotenv_1.default.config();
// Create the UploadManager instance
const uploadManager = new Bytescale.UploadManager({
    fetchApi: node_fetch_1.default,
    apiKey: process.env.BYTESCALE_API_KEY,
});
// Utility function to upload a file to Bytescale
const uploadFileToBytescale = async (filePath, originalFileName, mime) => {
    const fileStats = fs_1.default.statSync(filePath);
    const fileStream = fs_1.default.createReadStream(filePath);
    const result = await uploadManager.upload({
        data: fileStream,
        size: fileStats.size,
        mime,
        originalFileName: (0, exports.generateUniqueFileName)(originalFileName, "upload"),
    });
    return result.fileUrl;
};
exports.uploadFileToBytescale = uploadFileToBytescale;
const generateUniqueFileName = (originalName, prefix = "upload") => {
    const ext = path_1.default.extname(originalName);
    const randomId = (0, uuid_1.v4)().slice(0, 8);
    const timestamp = Date.now();
    return `${prefix}-${timestamp}-${randomId}${ext}`;
};
exports.generateUniqueFileName = generateUniqueFileName;
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { files: 10, fileSize: 10 * 1024 * 1024 }, // Limit to 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf",
            ".docx",
            ".webp",
        ];
        console.log('cb :', cb);
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."));
        }
        cb(null, true);
    },
});
