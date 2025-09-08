import { Request, Response } from "express";
import Offices from "../models/Admin/Office";
import OfficeWorker from "../models/Admin/OfficeWorker";
import CashFlow, { IFinance } from "../models/CashFlow";
import Transaction from "../models/Transaction";
import { AuthRequest } from "../types/type";
import { logActivity } from "../utils/activityLog";
import { errorResponse, successResponse } from "../utils/response";
import { checkIfDocumentExistsById, customReqResHandler } from "../utils/util";

export const getAllTransactions = async (req: Request, res: Response) => {
  const _req  = req as AuthRequest;
  const user = _req.user;

  if (user?.user_role !== "admin") {
    const transactions = await Transaction.find({ user_id: user?._id });
    successResponse(res, 200, "Transactions retrieved successfully", {
      transactions,
    });

    return;
  }
  const transactions = await Transaction.find({});
  successResponse(res, 200, "Transactions retrieved successfully", {
    transactions,
  });
};

export const getSingleTransaction = (req: Request, res: Response) => {
  const user = (req as any).user as any;
  const transactionId = req.params.id;

  if (!transactionId) {
    errorResponse(res, 400, "Transaction ID is required");
    return;
  }

  const request = async () => {
    await checkIfDocumentExistsById(
      transactionId,
      "transaction_id",
      res,
      Transaction
    );

    const transaction = await Transaction.findOne({
      transaction_id: transactionId,
    })
      .populate({
        path: "logs",
      })
      .populate({
        path: "user_id",
        select:
          "first_name last_name address phone_number distributor_location email user_role",
      })
      .populate({
        path: "order_id",
        select:
          "order_number status products  delivery_address    payment_status delivery_status total discount_amount",
      })
      .select("-internal_sequence -__v");
    // if (
    //   user?.user_role !== "admin" &&
    //   transaction?.user_id.toString() !== user?._id.toString()
    // ) {
    //   errorResponse(
    //     res,
    //     403,
    //     "You do not have permission to access this transaction"
    //   );
    //   return;
    // }

    return transaction;
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Transaction retrieved successfully",
    errorMessage: "Error retrieving transaction",
    statusCode: 200,
  });
};

export const updateTransaction = (req: Request, res: Response) => {
  const user = (req as any).user as any;
  if (!req.body) {
    errorResponse(res, 400, "Request body is required");
    return;
  }
  const request = async () => {
    const financeId = req.params.id;
    await checkIfDocumentExistsById<IFinance>(
      financeId,
      "cashflow_id",
      res,
      CashFlow
    );

    const updatedFinance = await CashFlow.findOneAndUpdate(
      { cashflow_id: financeId },
      { ...req.body },
      { new: true }
    );

    // Log the update activity
    const log = await logActivity({
      req,
      user_id: user?.user_id,
      action: "UPDATE_FINANCE_RECORD",
      description: `Updated finance record with ID ${financeId}`,
      sender: user?._id,
      receiver: user?._id,
      metadata: {
        financeId,
        changes: req.body,
      },
    });
    // Update the office wallet if the amount or type has changed
    await Offices.findByIdAndUpdate(user.office, {
      $push: { logs: log._id },
    });
    await OfficeWorker.findByIdAndUpdate(user.id, {
      $push: { logs: log._id },
    });

    return updatedFinance;
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Finance record updated successfully",
    errorMessage: "Error updating finance record",
    statusCode: 200,
  });
};
