// controllers/upload.controller.ts
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Request, Response } from "express";
import { r2 } from "../utils/R2";
import { errorResponse, successResponse } from "../utils/response";
import path from "path";
import { getRandom } from "../utils/util";
import { error } from "console";

export const uploadToR2 = async (req: Request, res: Response) => {
  if (!req.file) {
    errorResponse(res, 400, "No file uploaded");
    return;
  }

  const file = req.file;
  const originalExt = path.extname(file.originalname);
  const uniqueFilename = `${getRandom(20)}${originalExt}`;
  const fileName = `uploads/${Date.now()}-${uniqueFilename}`;

  try {
    // return;
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const publicUrl = `${process.env.CDN_URL}/${fileName}`;

    successResponse(res, 200, "File uploaded successfully", {
      url: publicUrl,
      fileName: uniqueFilename,
      originalName: file.originalname,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed", error: err });
    errorResponse(
      res,
      500,
      "Failed to upload file to R2",
      err instanceof Error ? err.message : "Unknown error"
    );
  }
};
