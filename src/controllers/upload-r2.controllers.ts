// controllers/upload.controller.ts
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Request, Response } from "express";
import { r2 } from "../utils/R2";
import { errorResponse, successResponse } from "../utils/response";
import path from "path";
import { getRandom } from "../utils/util";
import { error } from "console";

export const uploadToR2 = async (
  req: Request,
  res: Response,
  shouldIncludeSuccessResponse?: boolean
) => {
  if (!req.files) {
    errorResponse(res, 400, "No file uploaded");
    return;
  }

  try {
    const files = req.files as Express.Multer.File[];
    const fileNamesAndUrls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalExt = path.extname(file.originalname);
      const uniqueFilename = `${getRandom(20)}${originalExt}`;
      const fileName = `uploads/${Date.now()}-${uniqueFilename}`;
      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
      fileNamesAndUrls.push(fileName);
    }

    // return;

    const publicUrls = fileNamesAndUrls.map(
      (fileName) => `${process.env.CDN_URL}/${fileName}`
    );
    if (shouldIncludeSuccessResponse) {
      successResponse(res, 200, "File uploaded successfully", {
        url: publicUrls,
      });
    }
    return publicUrls;
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err });
    errorResponse(
      res,
      500,
      "Failed to upload file to R2",
      err instanceof Error ? err.message : "Unknown error"
    );
  }
};
