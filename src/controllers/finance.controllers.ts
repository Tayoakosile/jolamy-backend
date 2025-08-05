import { Request, Response } from "express";
import CashFlow, { IFinance } from "../models/CashFlow";
import { checkIfDocumentExistsById, customReqResHandler } from "../utils/util";
import Offices from "../models/Admin/Office";
import { logActivity } from "../utils/activityLog";
import { OfficeWorker } from "../models/Admin/OfficeWorker";
import { Types } from "mongoose";
import { errorResponse } from "../utils/response";

export const getAllFinance = (req: Request, res: Response) => {
  const request = async () => {
    return await CashFlow.find();
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Finance records retrieved successfully",
    errorMessage: "Error retrieving finance records",
    statusCode: 200,
  });
};

export const createNewFinance = (req: Request, res: Response) => {
  const user = (req as any).user;

  const request = async () => {
    const singleOffice = await Offices.findById(user.office);
    const checkIfCashFlowExists = await CashFlow.findOne({
      reference: req.body.reference,
    });

    if (checkIfCashFlowExists) {
      errorResponse(
        res,
        401,
        "Finance record with this reference already exists"
      );
      return;
    }

    const cashFlow = await CashFlow.create({
      ...req.body,
      created_by: user.id,
      office_id: new Types.ObjectId(user?.office_id),
    });

    const log = await logActivity({
      req,
      user_id: user._id,
      action: "CREATE_FINANCE_RECORD",
      description: "Created a new finance record",
      sender: user._id,
      receiver: user._id,
      metadata: {
        cashFlowId: cashFlow._id,
        officeId: user.office_id,
      },
    });
    const log2 = await logActivity({
      req,
      user_id: user._id,
      action: "UPDATE_OFFICE_WALLET",
      description: `Updated office wallet after ${req.body.type} transaction`,
      sender: user._id,
      receiver: user._id,
      metadata: {
        officeId: user.office_id,
        ...req.body,
        amount: req.body.amount,
        type: req.body.type,
      },
    });

    if (req.body.type === "inflow") {
      await Offices.findByIdAndUpdate(user.office, {
        $push: {
          transactions: cashFlow._id,
          logs: [log._id, log2._id],
          "wallet.logs": log2._id,
        },
        $set: {
          "wallet.balance":
            (singleOffice?.wallet?.balance as number) + Number(req.body.amount),
          "wallet.lastFundedBy": user._id,
          "wallet.lastFundedAmount": singleOffice?.wallet?.balance as number,
        },
      });
    }
    if (req.body.type === "outflow") {
      await Offices.findByIdAndUpdate(user.office, {
        $push: {
          transactions: cashFlow._id,
          logs: [log._id, log2._id],
        },
        $set: {
          "wallet.logs": log2._id,
          "wallet.balance":
            (singleOffice?.wallet?.balance as number) <= 0
              ? 0
              : (singleOffice?.wallet?.balance as number) -
                Number(req.body.amount),
        },
      });
    }

    await OfficeWorker.findByIdAndUpdate(user.id, {
      $push: { cash_flow: cashFlow._id, logs: log._id },
    });
  };
  customReqResHandler(res, request, undefined, {
    successMessage: "Finance record created successfully",
    errorMessage: "Error creating finance record",
    statusCode: 201,
  });
};

export const updateFinance = (req: Request, res: Response) => {
  const user = (req as any).user as any;
  if (!req.body) {
    errorResponse(res, 400, "Request body is required");
    return;
  }
  const request = async () => {
    const financeId = req.params.id;
    await checkIfDocumentExistsById<IFinance>(financeId, res, CashFlow);

    const updatedFinance = await CashFlow.findByIdAndUpdate(
      financeId,
      { ...req.body },
      { new: true }
    );

    // Log the update activity
    const log = await logActivity({
      req,
      user_id: user._id,
      action: "UPDATE_FINANCE_RECORD",
      description: `Updated finance record with ID ${financeId}`,
      sender: user._id,
      receiver: user._id,
      metadata: {
        financeId: updatedFinance?._id,
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
