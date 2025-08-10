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

export const generateRandom = (howMuch?: number, pattern?: string) => {
  return randomatic(pattern || "a0", howMuch || 18);
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
    "status",
    "cancelled_at",
    "actual_delivery_date",
  ];
  forbidden.forEach((f) => delete req.body[f]);
  next();
};

export const statusMap = {
  success: "paid",
  failed: "failed",
  abandoned: "cancelled",
  ongoing: "pending",
  pending: "pending",
  processing: "pending",
  queued: "processing",
  reversed: "refunded",
};

// data: {
// with metadata
//   [1]     status: true,
//   [1]     message: 'Authorization URL created',
//   [1]     data: {
//   [1]       authorization_url: 'https://checkout.paystack.com/pxwwj3o0z3c76n1',
//   [1]       access_code: 'pxwwj3o0z3c76n1',
//   [1]       reference: 'ie6ux1e48c'
//   [1]     }
//   [1]   }

export const transactions = {
  paystackResults: [
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/8y9hub8tlf5bbdq",
        access_code: "8y9hub8tlf5bbdq",
        reference: "y91l1is09t",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/7mk9lj0fv96d4am",
        access_code: "7mk9lj0fv96d4am",
        reference: "9vco0u3cgf",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/mwvoumxtexzfloa",
        access_code: "mwvoumxtexzfloa",
        reference: "0efe4vju3q",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/qeh1sqg5h4auwd9",
        access_code: "qeh1sqg5h4auwd9",
        reference: "tfcymoth16",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/bn3sklrx6db89zz",
        access_code: "bn3sklrx6db89zz",
        reference: "tig38bxsv8",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/10gtaqc74tax218",
        access_code: "10gtaqc74tax218",
        reference: "ef4hx6i3ji",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/9lmti3hqgsfzfzv",
        access_code: "9lmti3hqgsfzfzv",
        reference: "8lhepcsawl",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/5z3x9ejpj1obieh",
        access_code: "5z3x9ejpj1obieh",
        reference: "dkdhrqt5l1",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/scsxmk7d0r8mtsa",
        access_code: "scsxmk7d0r8mtsa",
        reference: "5vqd08ie5t",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/jaitxd3cmtb7uxa",
        access_code: "jaitxd3cmtb7uxa",
        reference: "u7rppa3dyt",
      },
    },
  ],
};
