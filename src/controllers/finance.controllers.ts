import { Request, Response } from "express";
import Offices, { IOffice } from "../models/Admin/Office";
import OfficeWorker from "../models/Admin/OfficeWorker";
import CashFlow, { IFinance } from "../models/CashFlow";
import { logActivity } from "../utils/activityLog";
import { errorResponse } from "../utils/response";
import { checkIfDocumentExistsById, customReqResHandler } from "../utils/util";

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
  const user = (req as any).worker;
  const amount = Number(req.body.amount);

  const request = async () => {
    const singleOffice = (await Offices.findById(user.office)) as IOffice;
    // console.log("singleOffice :", singleOffice);

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
      office_id: user?.office,
    });

    const log = await logActivity({
      req,
      user_id: user?.user_id,
      action: "CREATE_FINANCE_RECORD",
      description: "  Created a new finance record",
      sender: user?._id,
      receiver: user?._id,
      metadata: {
        cashFlowId: cashFlow.cashflow_id,
        officeId: user.office_id,
      },
    });

    const log2 = await logActivity({
      req,
      user_id: user?.user_id,
      action: "UPDATE_OFFICE_WALLET",
      description: `Updated office wallet after ${req.body.type} transaction`,
      sender: user?._id,
      receiver: user?._id,
      metadata: {
        officeId: user.office_id,
        ...req.body,
        amount: req.body.amount,
        type: req.body.type,
      },
    });
    console.log(
      "singleOffice?.wallet?.balance  :",
      singleOffice?.wallet?.balance
    );
    // console.log('singleOffice._id :', singleOffice._id);

    if (req.body.type === "outflow") {
      console.log("lf :");

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

    await OfficeWorker.findByIdAndUpdate(user._id, {
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
