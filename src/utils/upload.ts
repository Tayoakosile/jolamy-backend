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

// Utility function to upload a file to Bytescale
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

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 10, fileSize: 10 * 1024 * 1024 }, // Limit to 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
      ".docx",
    ];
    console.log('cb :', cb);

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed.")
      );
    }
    cb(null, true);
  },
});
