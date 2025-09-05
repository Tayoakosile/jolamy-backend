import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import Order from "../models/Order";
import { IOrder } from "../types/order.type";
import { errorResponse } from "../utils/response";
import { checkIfDocumentExistsById } from "../utils/util";

export const validateOrder = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (_req as any).user;
  const worker = (_req as any).worker;
  const orderID = (_req as any).params?.id;

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

  if (_req.method !== "GET") {
    // order?.delivery_status === "delivered"

    if (order?.payment_status === "paid") {
      if (!worker?.worker_id?.length && user?.user_role !== "admin") {
        errorResponse(res, 400, "Order cannot be updated", {
          message: "Order has already been paid",
        });
        return;
      }
    }
  }

  if (
    (isOrderAssignedToThisWorkerOffice && worker?.worker_id) ||
    checkIfOrderBelongsToUser ||
    user?.user_role === "admin"
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
