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

export const createNewOrder = (_req: AuthRequest, res: Response) => {
  const id = _req.user?._id;
  const body = _req.body;

  const request = async () => {
    const order = await Order.create({
      ...body,
      status:"pending",
      user_id: id,
      order_number: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    });
    return order;
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Order created successfully",
    errorMessage: "Error creating order",
    statusCode: 201,
  });
};
