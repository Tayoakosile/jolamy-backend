// src/controllers/upload.controller.ts

import { Request, Response } from "express";
import { uploadFileToBytescale } from "../utils/upload";
import path from "path";
import { encrypt } from "../utils/bcrypt.util";
import { generateToken } from "../utils/jwt";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    console.log("req :", req.body);

    const files = req.files as Express.Multer.File[];
    const urls: string[] = [];

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
