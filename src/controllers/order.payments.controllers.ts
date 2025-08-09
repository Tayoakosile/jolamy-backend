import { Response } from "express";
import Order, { IOrder } from "../models/Order";
import { AuthRequest, IUser } from "../types/type";
import { successResponse } from "../utils/response";
import { logActivity } from "../utils/activityLog";
import User from "../models/User";

export const initiatePayment = async (_req: AuthRequest, res: Response) => {
  try {
    const user = _req.user as IUser;
    const order = _req.order as IOrder;
    const order_id = _req.params.id;

    const log = await logActivity({
      req: _req,
      user_id: user._id,
      action: "initiate_payment",
      description: "User initiated payment for an order",
      receiver: user._id,
      sender: user._id,
      metadata: {
        order_id,
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        delivery_status: order.delivery_status,
      },
    });

    await Order.findByIdAndUpdate(order_id, {
      payment_status: "initiated",
      $push: { logs: log.id },
    });
    await User.findByIdAndUpdate(user._id, {
      $push: { logs: log.id },
    });

    successResponse(res, 200, "Payment initiated successfully", {
      order_id,
      user_id: user._id,
      user_name: user.username,
      user_email: user.email,
      order_details: {
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        delivery_status: order.delivery_status,
      },
    });
  } catch (error) {
    console.error("Error initiating payment:", error);
    res.status(500).json({
      message: "An error occurred while initiating payment",
      error: error || "Internal Server Error",
    });
  }
};

export const verifyPayment = async (_req: AuthRequest, res: Response) => {
  try {
    const user = _req.user as IUser;
    const order = _req.order as IOrder;
    const order_id = _req.params.id;

    const log = await logActivity({
      req: _req,
      user_id: user._id,
      action: "initiate_payment",
      description: "User initiated payment for an order",
      receiver: user._id,
      sender: user._id,
      metadata: {
        order_id,
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        delivery_status: order.delivery_status,
      },
    });

    await Order.findByIdAndUpdate(order_id, {
      payment_status: "initiated",
      $push: { logs: log.id },
    });
    await User.findByIdAndUpdate(user._id, {
      $push: { logs: log.id },
    });

    successResponse(res, 200, "Payment initiated successfully", {
      order_id,
      user_id: user._id,
      user_name: user.username,
      user_email: user.email,
      order_details: {
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        delivery_status: order.delivery_status,
      },
    });
  } catch (error) {
    console.error("Error initiating payment:", error);
    res.status(500).json({
      message: "An error occurred while initiating payment",
      error: error || "Internal Server Error",
    });
  }
};
