"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToR2 = void 0;
// controllers/upload.controller.ts
const client_s3_1 = require("@aws-sdk/client-s3");
const path_1 = __importDefault(require("path"));
const R2_1 = require("../utils/R2");
const response_1 = require("../utils/response");
const util_1 = require("../utils/util");
const uploadToR2 = async (req, res) => {
    if (!req.files) {
        (0, response_1.errorResponse)(res, 400, "No file uploaded");
        return;
    }
    // return;
    try {
        const files = req.files;
        const fileNamesAndUrls = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const originalExt = path_1.default.extname(file.originalname);
            const uniqueFilename = `${(0, util_1.generateRandom)(20)}${originalExt}`;
            const fileName = `uploads/${Date.now()}-${uniqueFilename}`;
            await R2_1.r2.send(new client_s3_1.PutObjectCommand({
                Bucket: process.env.R2_BUCKET,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));
            fileNamesAndUrls.push(fileName);
        }
        // return;
        const publicUrls = fileNamesAndUrls.map((fileName) => `${process.env.CDN_URL}/${fileName}`);
        console.log('publicUrls :', publicUrls);
        (0, response_1.successResponse)(res, 200, "File uploaded successfully", {
            url: publicUrls,
        });
        return publicUrls;
    }
    catch (err) {
        (0, response_1.errorResponse)(res, 500, "Failed to upload file to R2", err instanceof Error ? err.message : "Unknown error");
        // next ? next() : undefined;
    }
};
exports.uploadToR2 = uploadToR2;
