import { Request, Response } from "express";
import CashFlow from "../models/CashFlow";
import { customReqResHandler } from "../utils/util";

export const getAllFinance = (req: Request, res: Response) => {
    console.log('req :', req);

  const request = async () => {
    return await CashFlow.find();
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Finance records retrieved successfully",
    errorMessage: "Error retrieving finance records",
    statusCode: 200,
  });
};
