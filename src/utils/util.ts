// utils/checkIfExists.ts

import { Response } from "express";
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
    return errorResponse(res, 400, "Invalid ID format", {
      message: "Invalid ID format",
    });
  }
  if (populateFields) {
    const populatedDocument = await Model.findById(id).populate(populateFields);
    if (!populatedDocument) {
      return errorResponse(res, 404, "Document not found", {
        message: "Document not found",
      });
    }
    return populatedDocument;
  }
  const document = await Model.findById(id);
  if (!document) {
    return errorResponse(res, 404, "Document not found", {
      message: "Document not found",
    });
  }
  return document;
};

export const getRandom = (howMuch?: number) => {
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
    successMessage: "Operation successful",
    data: null,
  },

  shouldSendMail?: boolean,
  mailTo?: string,
  title?: string,
  message?: string
) => {
  try {
    const response = await reqFunction();

    if (shouldSendMail) {
      await sendEmail(mailTo as string, title as string, message as string);
    }
    return successResponse(
      res,
      responseData.statusCode,
      responseData.successMessage,
      responseData.data || response
    );
  } catch (error) {
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
