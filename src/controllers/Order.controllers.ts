import { Request, Response } from "express";
import Order from "../models/Order";
import { customReqResHandler } from "../utils/util";

export const getAllOrders = (_req: AuthRequest, res: Response) => {
  const request = async () => {
    return await Order.find();
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Orders retrieved successfully",
    errorMessage: "Error retrieving orders",
    statusCode: 200,
  });
};
