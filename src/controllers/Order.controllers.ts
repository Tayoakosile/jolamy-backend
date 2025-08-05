import { Response } from "express";
import Order from "../models/Order";
import { AuthRequest } from "../types/type";
import { customReqResHandler } from "../utils/util";

export const getAllOrders = (_req: AuthRequest, res: Response) => {
  const id = _req.user?._id;

  const request = async () => {
    return await Order.find({ user_id: id });
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Orders retrieved successfully",
    errorMessage: "Error retrieving orders",
    statusCode: 200,
  });
};

