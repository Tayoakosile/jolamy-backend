import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import Order from "../models/Order";
import SalesAgentOrder, { ISalesAgentOrder } from '../models/SalesAgentOrders';
import { IOrder } from "../types/order.type";
import { AuthRequest } from "../types/type";
import { errorResponse } from "../utils/response";
import { checkIfDocumentExistsById } from "../utils/util";

export const validateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const _req = req as AuthRequest;
  const user = _req.user;
  const worker = _req.worker;
  const orderID = _req.params?.id;

  const order = user?.is_distributor
    ? await checkIfDocumentExistsById<IOrder>(
        orderID,
        Types.ObjectId.isValid(orderID) ? "_id" : "order_number",
        res,
        Order,
        ["user_id"]
      )
    : await checkIfDocumentExistsById<ISalesAgentOrder>(
        orderID,
        Types.ObjectId.isValid(orderID) ? "_id" : "order_number",
        res,
        SalesAgentOrder,
        ["user_id"]
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

    if (order?.status === "completed" || order?.status === "cancelled") {
      errorResponse(res, 400, "Order cannot be updated", {
        message: `Order has already been ${order?.status}`,
      });
      return;
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
