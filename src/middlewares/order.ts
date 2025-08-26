import { NextFunction, Response } from "express";
import { errorResponse } from "../utils/response";
import { checkIfDocumentExistsById } from "../utils/util";
import Order from "../models/Order";
import { AuthRequest } from "../types/type";
import { Types } from "mongoose";
import { IOrder } from "../types/order.type";

export const validateOrder = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = _req.user;
  const worker = _req.worker;
  const orderID = _req.params?.id;

  const order = await checkIfDocumentExistsById<IOrder>(
    orderID,
    Types.ObjectId.isValid(orderID) ? "_id" : "order_number",
    res,
    Order
  );

  const isOrderAssignedToThisWorkerOffice =
    order?.assigned_to?.office?._id?.toString() === worker?.office?.toString();

  // Ensure both IDs are strings for comparison
  const checkIfOrderBelongsToUser = user?.orders.some(
    (singleOrder: any) => String(singleOrder._id) === String(order?._id)
  );

  // If payment made already or it is delivered, do not allow update

  if (
    (_req.method !== "GET" &&
      order?.payment_status === "paid" &&
      user?.user_role !== "admin") ||
    (_req.method !== "GET" &&
      order?.delivery_status === "delivered" &&
      user?.user_role !== "admin")
  ) {
    errorResponse(res, 400, "Order cannot be updated", {
      message: "Order has already been paid or delivered",
    });
    return;
  }


  if (
    (isOrderAssignedToThisWorkerOffice && worker?.worker_id) ||
    checkIfOrderBelongsToUser
  ) {
    (_req as any).order = order as IOrder;
    next();
    return;
  }
  errorResponse(res, 404, "Order not found", {
    message: `Order not found or does not belong to this ${
      worker?.worker_id ? "Office" : "user"
    }`,
  });
  return;
};
