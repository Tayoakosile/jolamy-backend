import { Request, Response } from "express";
import Offices, { IOffice } from "../models/Admin/Office";
import OfficeWorker from "../models/Admin/OfficeWorker";
import CashFlow, { IFinance } from "../models/CashFlow";
import { AuthRequest } from "../types/type";
import { logActivity } from "../utils/activityLog";
import { errorResponse } from "../utils/response";
import { getTrend } from "../utils/trend.util";
import { checkIfDocumentExistsById, customReqResHandler } from "../utils/util";

export const getAllFinance = (req: AuthRequest, res: Response) => {
  // Only admin and worker can access this route
  if (req.isOtherUser) {
    errorResponse(res, 401, "Not authorized, worker/admin access only", {
      message: "Not authorized, worker/admin access only",
    });
    return;
  }
  const worker = req?.worker;

  const request = async () => {
    if (req.isWorker) {
      return await CashFlow.find({
        office_id: worker?.office,
        created_by: worker?._id,
      }).populate({
        path: "created_by",
        select: "first_name last_name email worker_id user_id role",
      });
    }

    if (req.isUserAdmin) {
      const allTransactions = await getTrend(CashFlow, {
        period: "week",
      });
      const transactionTotal = await getTrend(CashFlow, {
        period: "week",
        sumField: "amount",
      });
      const allInflowTransactions = await getTrend(CashFlow, {
        period: "week",
        filter: { type: "inflow" },
      });
      const allOutflowTransactions = await getTrend(CashFlow, {
        period: "week",
        filter: { type: "inflow" },
      });

      // const allTransactions = await getTrend(CashFlow, {
      //   period: "week",
      // });
      const adminCashFlow = await CashFlow.find().populate([
        {
          path: "created_by",
          select: "first_name last_name email worker_id user_id role",
        },
        {
          path: "office_id",
          select: "name address office_id _id",
        },
      ]);
      return {
        stats: [
          {
            title: "Total CashFlow Counts",
            ...allTransactions,
            // type: "currency",
          },
          {
            title: "Inflow Transactions",
            ...allInflowTransactions,
            // type: "currency",
          },
          {
            title: "Outflow Transactions",
            ...allOutflowTransactions,
            // type: "currency",
          },
          { title: "Total Amount", ...transactionTotal, type: "currency" },
        ],
        cashFlows: adminCashFlow,
      };
    }
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Finance records retrieved successfully",
    errorMessage: "Error retrieving finance records",
    statusCode: 200,
  });
};

export const createNewFinance = (req: AuthRequest, res: Response) => {
  const user = req?.worker;
  const isOtherUser = req.isOtherUser;
  const isWorker = req.isWorker;

  if (isWorker && isOtherUser) {
    errorResponse(res, 401, "Not authorized, worker/admin access only", {
      message: "Not authorized, worker/admin access only",
    });
    return;
  }

  const amount = Number(req.body.amount);

  const request = async () => {
    const singleOffice = (await Offices.findById(user?.office)) as IOffice;

    const checkIfCashFlowExists = await CashFlow.findOne({
      reference: req.body.reference,
    });

    if (checkIfCashFlowExists) {
      errorResponse(
        res,
        400,
        "Finance record with this reference already exists"
      );
      return;
    }

    const cashFlow = await CashFlow.create({
      ...req.body,
      created_by: user?.id,
      office_id: user?.office,
    });

    const log = await logActivity({
      req,
      user_id: user?.id,
      action: "CREATE_FINANCE_RECORD",
      description: "  Created a new finance record",
      sender: user?._id,
      receiver: user?._id,
      metadata: {
        cashFlowId: cashFlow.cashflow_id,
        officeId: user?.office_id,
      },
    });

    const log2 = await logActivity({
      req,
      user_id: user?.id,
      action: "UPDATE_OFFICE_WALLET",
      description: `Updated office wallet after ${req.body.type} transaction`,
      sender: user?._id,
      receiver: user?._id,
      metadata: {
        officeId: user?.office_id,
        ...req.body,
        amount: req.body.amount,
        type: req.body.type,
      },
    });

    if (req.body.type === "outflow") {
      await Offices.findByIdAndUpdate(singleOffice._id, {
        $expr: {
          $gte: [
            "$wallet.balance",
            singleOffice?.wallet && Number(singleOffice?.wallet?.balance) <= 0
              ? 0
              : amount,
          ],
        },
        $push: {
          transactions: cashFlow._id,
          logs: { $each: [log._id, log2._id] },
          "wallet.logs": log2._id,
        },
        $inc: {
          "wallet.balance":
            Number(singleOffice?.wallet?.balance) <= 0 ? 0 : -amount,
        },
      });
    } else if (req.body.type === "inflow") {
      await Offices.findByIdAndUpdate(singleOffice._id, {
        $push: {
          transactions: cashFlow._id,
          logs: { $each: [log._id, log2._id] },
          "wallet.logs": log2._id,
        },
        $inc: { "wallet.balance": amount },
      });
    }

    await OfficeWorker.findByIdAndUpdate(user?._id, {
      $push: { cash_flow: cashFlow._id, logs: log._id },
    });
    return cashFlow;
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Finance record created successfully",
    errorMessage: "Error creating finance record",
    statusCode: 201,
  });
};

export const updateFinance = (req: Request, res: Response) => {
  const user = (req as any).worker as any;
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
    await Offices.findByIdAndUpdate(user?.office, {
      $push: { logs: log._id },
    });
    await OfficeWorker.findByIdAndUpdate(user?.id, {
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

export const getSingleFinance = (req: AuthRequest, res: Response) => {
  const user = (req as any).worker as any;
  const request = async () => {
    const financeId = req.params.id;
    const SingleFinance = await checkIfDocumentExistsById<IFinance>(
      financeId,
      "cashflow_id",
      res,
      CashFlow,
      ["created_by", "office_id"]
    );

    if (!SingleFinance && !req.isWorker) {
      errorResponse(res, 404, "Finance record not found");
      return;
    }

    // Log the update activity
    const log = await logActivity({
      req,
      user_id: user?.user_id,
      action: "VIEW_FINANCE_RECORD",
      description: `  Viewed finance record with ID ${financeId}`,
      sender: user?._id,
      receiver: user?._id,
      metadata: {
        financeId,
      },
    });
    // Update the office wallet if the amount or type has changed
    await Offices.findByIdAndUpdate(user?.office, {
      $push: { logs: log._id },
    });
    await OfficeWorker.findByIdAndUpdate(user?.id, {
      $push: { logs: log._id },
    });

    if (req.isWorker) {
      if (
        SingleFinance?.office_id?._id?.toString() !== user?.office?.toString()
      ) {
        errorResponse(res, 404, "Finance record details not found");
        return;
      }
    }

    return SingleFinance;
  };
  customReqResHandler(res, request, undefined, {
    successMessage: "Finance record retrieved successfully",
    errorMessage: "Error retrieving finance record",
    statusCode: 200,
  });
};
