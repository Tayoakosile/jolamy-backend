import axios from "axios";
import { Response } from "express";
import Order, { IOrder } from "../models/Order";
import User from "../models/User";
import { AuthRequest, IUser } from "../types/type";
import { logActivity } from "../utils/activityLog";
import { errorResponse, successResponse } from "../utils/response";
import { Types } from "mongoose";
import { Cart } from "../models/Cart";
import { statusMap } from "../utils/util";
import { sendEmail } from "../services/mail.service";

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

export const initiatePaymentWithPaystack = async (order_id: string) => {
  return await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email: "oluwatayoakosile@gmail.com",
      amount: Number(2000) * 100, // Paystack expects amount in kobo
      metadata: {
        cart_id: order_id,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const verifyPayment = async (_req: AuthRequest, res: Response) => {
  try {
    // run this  10x

    const user = _req.user as IUser;
    const order = _req.order as IOrder;
    const order_id = _req.params.id;
    const reference = _req.body?.reference as string;
    if (!reference) {
      return res.status(400).json({
        message: "Payment reference is required",
      });
    }

    // return;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    // console.log("response :", response.data?.data);
    const responseFromPaystack = response.data?.data;
    const status = (responseFromPaystack?.status ||
      "unknown") as keyof typeof statusMap;

    // return;
    const log = await logActivity({
      req: _req,
      user_id: user._id,
      action: "VERIFY_PAYMENT",
      description: "User verified payment for an order",
      receiver: user._id,
      sender: user._id,
      metadata: {
        order_id,
        total_amount: order.total_amount,
        payment_status: "paid",
        payment_reference: response.data?.data?.reference,
      },
    });
    if (
      statusMap[status] === "paid" &&
      responseFromPaystack?.metadata?.cart_id == order_id?.toString()
    ) {
      await Order.findByIdAndUpdate(order_id, {
        payment_status: "paid",
        delivery_status: "processing",
        status: "processing",
        payment_reference: response.data?.data?.reference,
        $push: { logs: new Types.ObjectId(log.id) },
      });

      await User.findByIdAndUpdate(user._id, {
        $push: { logs: new Types.ObjectId(log.id) },
      });

      //   find the cart and delete it items array, if the id is in items then delete the collection
      await Cart.updateOne(
        { user_id: user._id, order_id },
        { $pull: { items: { order_id } } }
      );
      await Cart.findByIdAndDelete(user.id, {
        $or: [{ user_id: user._id }, { order_id }],
      });
      sendEmail(
        user.email,
        "Payment Successful",
        `Your payment for order ${order_id} has been successfully verified. Thank you for your purchase!`
      );
      successResponse(res, 200, "Payment verified successfully", {
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
      return;
    }
    if (statusMap[status] === "pending") {
      await Order.findByIdAndUpdate(order_id, {
        $push: { logs: new Types.ObjectId(log.id) },
      });

      await User.findByIdAndUpdate(user._id, {
        $push: { logs: new Types.ObjectId(log.id) },
      });

      successResponse(res, 202, "Payment is pending", {
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
      return;
    }

    if (["failed", "reversed", "abandoned"].includes(status)) {
      await Order.findByIdAndUpdate(order_id, {
        payment_status: statusMap[status],
        $push: { logs: new Types.ObjectId(log.id) },
        status: statusMap[status],
      });

      await User.findByIdAndUpdate(user._id, {
        $push: { logs: new Types.ObjectId(log.id) },
      });

      sendEmail(
        user.email,
        "Payment Failed",
        `Your payment for order ${order_id} has failed or been reversed. Please try again or contact support.`
      );
      errorResponse(res, 400, "Payment failed,abadoned or reversed", {
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
      return;
    }
  } catch (error: any) {
    console.error("Error initiating payment:", error?.response?.data || error);
    res.status(500).json({
      message: "An error occurred while initiating payment",
      error: error || "Internal Server Error",
    });
  }
};
