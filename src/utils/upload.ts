// src/utils/uploadToBytescale.ts
import { v4 as uuidv4 } from "uuid";

import * as Bytescale from "@bytescale/sdk";
import nodeFetch from "node-fetch";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
dotenv.config();
// Create the UploadManager instance
const uploadManager = new Bytescale.UploadManager({
  fetchApi: nodeFetch as any,
  apiKey: process.env.BYTESCALE_API_KEY as string,
});

// Utility function to upload
export const uploadFileToBytescale = async (
  filePath: string,
  originalFileName: string,
  mime: string
) => {
  const fileStats = fs.statSync(filePath);
  const fileStream = fs.createReadStream(filePath);

  const result = await uploadManager.upload({
    data: fileStream,
    size: fileStats.size,
    mime,
    originalFileName: generateUniqueFileName(originalFileName, "upload"),
  });

  return result.fileUrl;
};

export const generateUniqueFileName = (
  originalName: string,
  prefix = "upload"
) => {
  const ext = path.extname(originalName);
  const randomId = uuidv4().slice(0, 8);
  const timestamp = Date.now();
  return `${prefix}-${timestamp}-${randomId}${ext}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "../uploads/"); // Make sure this folder exists at project root
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });
