import { NextFunction, Response } from "express";
import { errorResponse } from "../utils/response";
import { checkIfDocumentExistsById } from "../utils/util";
import Order, { IOrder } from "../models/Order";
import { AuthRequest } from "../types/type";

export const validateOrder = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = _req.user;
  const orderID = _req.params?.id;
  const order = await checkIfDocumentExistsById<IOrder>(
    orderID,
    "order_id",
    res,
    Order
  );
  const checkIfOrderBelongsToUser = user?.orders.find(
    (order: any) => order._id.toString() === orderID
  );

  // If payment made already or it is delivered, do not allow update
  if (
    order?.payment_status === "paid" ||
    order?.delivery_status === "delivered"
  ) {
    errorResponse(res, 400, "Order cannot be updated", {
      message: "Order has already been paid or delivered",
    });
    return next();
  }
  if (!checkIfOrderBelongsToUser) {
    errorResponse(res, 404, "Order not found", {
      message: "Order not found or does not belong to the user",
    });
    return next();
  }
  (_req as any).order = order as IOrder;
  next();
};
