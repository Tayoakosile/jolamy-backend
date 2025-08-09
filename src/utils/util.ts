// utils/checkIfExists.ts

import { NextFunction, Request, Response } from "express";
import mongoose, { Document } from "mongoose";
import randomatic from "randomatic";
import { sendEmail } from "../services/mail.service";
import { errorResponse, successResponse } from "./response";

/**
 * Checks if a user exists by ID.
 * @param id - The MongoDB ObjectId as string.
 * @param res - Res passed down.
 * @returns The user document if found, or null.
 * @throws Error if the ID is invalid or the DB fails.
 */
export const checkIfDocumentExistsById = async <T extends Document>(
  id: string,
  res: Response,
  Model: mongoose.Model<T>,
  populateFields?: string | string[]
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    errorResponse(res, 400, "Invalid ID format", {
      message: "Invalid ID format",
    });
    return;
  }
  if (populateFields) {
    const populatedDocument = await Model.findById(id).populate(populateFields);
    if (!populatedDocument) {
      errorResponse(res, 404, "Document not found", {
        message: "Document not found",
      });
      return;
    }

    return populatedDocument;
  }
  const document = await Model.findById(id);
  if (!document) {
    errorResponse(res, 404, "Document not found", {
      message: "Document not found",
    });
    return;
  }
  return document;
};

export const generateRandom = (howMuch?: number) => {
  return randomatic("a0", howMuch || 18);
};

export const customReqResHandler = async (
  res: Response,
  reqFunction: () => void,
  errorFunction?: (error: any) => void | undefined,
  responseData: {
    statusCode?: 200 | 201 | 202 | 204;
    errorStatusCode?: 400 | 401 | 403 | 404;
    successMessage: string;
    errorMessage?: string;
    data?: any;
    successData?: any;
    error?: any;
  } = {
    statusCode: 200,
    successMessage: "",
    data: null,
  },
  mailOptions: {
    shouldSendMail?: boolean;
    mailTo?: string;
    title?: string;
    message?: string;
  } = {
    shouldSendMail: false,
  }
) => {
  try {
    const response = await reqFunction();

    if (mailOptions.shouldSendMail) {
      await sendEmail(
        mailOptions.mailTo as string,
        mailOptions.title as string,
        mailOptions.message as string
      );
    }
    return successResponse(
      res,
      responseData.statusCode,
      responseData.successMessage,
      responseData.data || response
    );
  } catch (error) {
    console.log("error :", error);

    errorFunction
      ? errorFunction(error)
      : errorResponse(
          res,
          responseData.errorStatusCode || 500,
          responseData.errorMessage,
          responseData.error || error
        );
  }
};

export const timestamp = {
  createdAt: "created_at",
  updatedAt: "updated_at",
};

export async function generateEntityNumber(
  entityPrefix: string,
  model: mongoose.Model<any>
) {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;

  // Find the latest entry for the current year+month
  const latest = await model
    .findOne({ entity_number: new RegExp(`^${entityPrefix}-${yearMonth}`) })
    .sort({ createdAt: -1 });

  let sequence = 1;
  if (latest) {
    const lastSeq = parseInt(latest.entity_number.split("-")[2], 10);
    sequence = lastSeq + 1;
  }

  return `${entityPrefix}-${yearMonth}-${generateRandom(6)}-${String(
    sequence
  ).padStart(4, "0")}`;
}
export const removeSensitiveFields = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const forbidden = [
    "payment_status",
    "estimated_date",
    "estimatedDate",
    "delivery_status",
    "refund_status",
    "order_number",
    "order_id",
    "internal_sequence",
    "total_amount",
    "discount_amount",
    "tax_amount",
    "tracking_number",
    "courier_service",
    "payment_reference",
    "createdAt",
    "updatedAt",
    "logs",
    "cancelled_at",
    "actual_delivery_date",
  ];
  forbidden.forEach((f) => delete req.body[f]);
  next();
};
