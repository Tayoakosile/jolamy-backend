// src/controllers/upload.controller.ts

import { Request, Response } from "express";
import path from "path";
import { uploadFileToBytescale } from "../utils/upload";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const urls: string[] = [];


    console.log('files :', files);

    for (const file of files) {
      const fullPath = path.join(process.cwd(), file.path);
      const fileUrl = await uploadFileToBytescale(
        fullPath,
        file.originalname,
        file.mimetype
      );

      urls.push(fileUrl);
    }
  } catch (error) {
    res.status(500).json({
      message: "Upload failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
