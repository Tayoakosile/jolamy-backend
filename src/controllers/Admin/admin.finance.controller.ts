import { Request, Response } from "express";
import Offices, { IOffice } from "../../models/Admin/Office";
import User from "../../models/User";
import { logActivity } from "../../utils/activityLog";
import { errorResponse } from "../../utils/response";
import {
  checkIfDocumentExistsById,
  customReqResHandler,
} from "../../utils/util";
import CashFlow from "../../models/CashFlow";
import { Types } from "mongoose";
import { AuthRequest } from "../../types/type";

export const getAllCashFlow = async (req: Request, res: Response) => {
  const request = async () => {
    return await CashFlow.find();
  };
  customReqResHandler(res, request, undefined, {
    successMessage: "CashFlows retrieved successfully",
    errorMessage: "Error retrieving cash flows",
    statusCode: 200,
  });
};

export const getSingleCashFlow = async (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  const id = _req.params.id;
  const cash_flow = await checkIfDocumentExistsById<IOffice>(
    id,
    "office_id",
    res,
    Offices,
    ["created_by", "logs"]
  );

  const request = async () => {
    const log = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(_req.user?._id),
      action: "GET_SINGLE_CASH_FLOW",
      description: "Retrieved cash flow successfully",
      metadata: {
        ...cash_flow,
        user_id: `${_req.user?._id}`,
      },
    });

    await User.findByIdAndUpdate(_req.user?._id, {
      $push: { logs: log._id },
    });
    return cash_flow;
  };
  await customReqResHandler(res, request, undefined, {
    successMessage: "CashFlow retrieved successfully",
    errorMessage: "Error retrieving office",
    statusCode: 200,
  });
};
/**
 *
 *
 * @param {AuthRequest} req
 * @param {Response} res
 */
export const createNewOffices = async (_req: Request, res: Response) => {
  const req = _req as AuthRequest;
  const request = async () => {
    const existingOffice = await Offices.exists({})
      .where("name")
      .equals(req.body.name);
    if (existingOffice) {
      errorResponse(res, 400, "Office with this name already exists", {
        message: "Office with this name already exists",
      });
      return;
    }
    const newOffice = await Offices.create({
      ...req.body,
      created_by: req.user?._id,
    });
    const log = await logActivity({
      req,
      user_id: new Types.ObjectId(req.user?._id),
      action: "CREATE_OFFICE",
      description: "New office created",
      metadata: {
        ...newOffice,
        user_id: `${req.user?._id}`,
      },
    });
    newOffice.logs = Array.isArray(newOffice.logs)
      ? [...newOffice.logs, log._id]
      : [log._id];
    await newOffice.save();
    await User.findByIdAndUpdate(req.user?._id, {
      $push: { logs: log._id },
    });
    return newOffice;
  };

  customReqResHandler(
    res,
    request,
    undefined,
    {
      successMessage: "New office created successfully",
      errorMessage: "Error creating new office",
      statusCode: 201,
      errorStatusCode: 400,
    },
    {
      shouldSendMail: true,
      mailTo: req.user?.email,
      title: "New Office Created",
      message: `A new office has been created with the name ${req.body.name}.`,
    }
  );
};

export const updateOffice = async (_req: Request, res: Response) => {
  const req = _req as AuthRequest;
  const id = req.params.id;
  await checkIfDocumentExistsById<IOffice>(id, "office_id", res, Offices);

  const request = async () => {
    const updatedOffice = (await Offices.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    )) as IOffice;

    const log = await logActivity({
      req,
      user_id: new Types.ObjectId(req.user?._id),
      action: "UPDATE_OFFICE",
      description: "Office updated successfully",
      metadata: {
        ...updatedOffice,
        user_id: `${req.user?._id}`,
      },
    });
    updatedOffice.logs = Array.isArray(updatedOffice.logs)
      ? [...updatedOffice.logs, log._id]
      : [log._id];
    await updatedOffice.save();
    await User.findByIdAndUpdate(req.user?._id, {
      $push: { logs: log._id },
    });
    return updatedOffice;
  };

  await customReqResHandler(res, request, undefined, {
    successMessage: "Office updated successfully",
    errorMessage: "Error updating office",
    statusCode: 200,
  });
};

export const adminFundWallet = async (_req: Request, res: Response) => {
  const req = _req as AuthRequest;
  const officeId = req.params.id;
  const request = async () => {
    const office = await checkIfDocumentExistsById<IOffice>(
      officeId,
      "office_id",
      res,
      Offices
    );

    if (!office) {
      errorResponse(res, 404, "Office not found");
      return;
    }

    // Assuming the amount to fund is passed in the request body
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      errorResponse(res, 400, "Invalid amount to fund");
      return;
    }

    // Update the office wallet balance
    if (!office.wallet) {
      office.wallet = { balance: 0 };
    }
    office.wallet.balance += amount;

    // Log the funding activity
    const log = await logActivity({
      req,
      user_id: new Types.ObjectId(req.user?._id),
      description: `Wallet funded by ${req.user?.first_name} ${req.user?.last_name} with amount ${amount}`,
      action: "FUND_OFFICE_WALLET",
      metadata: {
        office_id: officeId,
        funded_amount: amount,
        user_id: `${req.user?._id}`,
      },
    });

    office.logs = Array.isArray(office.logs)
      ? [...office.logs, log._id]
      : [log._id];

    const cashflow = await CashFlow.create({
      type: "inflow",
      office_id: office._id,
      amount,
      description: `Office wallet funded: ${office.name} with amount ${amount}`,
      attachments: req.body.attachments || [],
      office: office._id,
      notes: req.body.notes || "",
      reference: `FUND-${office.office_id}-${Date.now()}`,
      status: "completed",
      created_by: req.user?._id,
      metadata: {
        funded_by: req.user?._id,
        office_id: office._id,
        office_name: office.name,
      },
    });

    office.transactions = Array.isArray(office.transactions)
      ? [...office.transactions, cashflow._id]
      : [cashflow._id];
    office.wallet.last_funded_by = req.user?._id;
    office.wallet.last_funded_amount = amount;
    office.wallet.logs = Array.isArray(office.wallet.logs)
      ? [...office.wallet.logs, log._id]
      : [log._id];

    await office.save();
    await User.findByIdAndUpdate(req.user?._id, {
      $push: { logs: log._id },
    });

    return { message: "Wallet funded successfully", office };
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Wallet funded successfully",
    errorMessage: "Error funding wallet",
    statusCode: 200,
  });
};
