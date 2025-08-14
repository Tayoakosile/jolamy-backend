import { NextFunction, Response } from "express";
import { errorResponse } from "../utils/response";
import { checkIfDocumentExistsById } from "../utils/util";
import Order, { IOrder } from "../models/Order";
import { AuthRequest } from "../types/type";
import { Types } from "mongoose";

export const validateOrder = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = _req.user;
  const orderID = _req.params?.id;

  const order = await checkIfDocumentExistsById<IOrder>(
    orderID,
    Types.ObjectId.isValid(orderID) ? "_id" : "order_number",
    res,
    Order
  );

  // Ensure both IDs are strings for comparison
  const checkIfOrderBelongsToUser = user?.orders.some(
    (singleOrder: any) => String(singleOrder._id) === String(order?._id)
  );

  // If payment made already or it is delivered, do not allow update

  if (
    (_req.method !== "GET" && order?.payment_status === "paid") ||
    (_req.method !== "GET" && order?.delivery_status === "delivered")
  ) {
    errorResponse(res, 400, "Order cannot be updated", {
      message: "Order has already been paid or delivered",
    });
    return;
  }
  if (user?.user_role !== "admin" && !checkIfOrderBelongsToUser) {
    errorResponse(res, 404, "Order not found", {
      message: "Order not found or does not belong to the user",
    });
    return;
  }
  (_req as any).order = order as IOrder;
  next();
};
