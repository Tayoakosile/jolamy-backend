import axios from "axios";
import { Response } from "express";
import Order from "../models/Order";

import User from "../models/User";
import { AuthRequest, IUser } from "../types/type";
import { logActivity } from "../utils/activityLog";
import { errorResponse, successResponse } from "../utils/response";
import { Types } from "mongoose";
import { Cart } from "../models/Cart";
import { statusMap } from "../utils/util";
import { sendEmail } from "../services/mail.service";
import Transaction from "../models/Transaction";
import Offices from "../models/Admin/Office";
import { IOrder } from "../types/order.type";

export const initiatePayment = async (_req: AuthRequest, res: Response) => {
  try {
    const user = _req.user as IUser;
    const order = _req.order as IOrder;
    const order_id = _req.params.id;
    console.log("order :", order.payment_status);
    if (order.payment_status === "initiated") {
      successResponse(res, 200, "Payment initiated successfully", {
        order_id,
        user_id: user?.user_id,
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
    const log = await logActivity({
      req: _req,
      user_id: user?._id,
      action: "INITIATE_PAYMENT",
      description: `${user?.full_name} initiated payment for order ${order_id}`,
      receiver: user._id,
      sender: new Types.ObjectId(`${user._id}`),
      metadata: {
        order_id,
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        delivery_status: order.delivery_status,
      },
    });

    await Order.findOneAndUpdate(
      { order_number: order_id },
      {
        payment_status: "initiated",
        $push: { logs: log.id },
      }
    );
    await User.findByIdAndUpdate(user._id, {
      $push: { logs: log.id },
    });
    await Transaction.findByIdAndUpdate(user?._id, {
      $push: { logs: log.id },
    });

    successResponse(res, 200, "Payment initiated successfully", {
      order_id,
      user_id: user?.user_id,
      user_name: user.username,
      user_email: user.email,
      order_details: {
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        delivery_status: order.delivery_status,
      },
    });
    return;
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
    const user = _req.user as IUser;
    const order = _req.order as IOrder;
    if (order.payment_status !== "initiated") {
      res.status(400).json({
        message: "Payment has not been initiated for this order",
      });
      return;
    }
    const order_id = _req.params.id;
    const reference = _req.body?.reference as string;
    if (!reference) {
      return res.status(400).json({
        message: "Payment reference is required",
      });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const responseFromPaystack = response.data?.data;
    const status = (responseFromPaystack?.status ||
      "unknown") as keyof typeof statusMap;

    // return;

    // automatically assign order to an office and then log

    if (
      statusMap[status] === "paid"
      // &&responseFromPaystack?.metadata?.cart_id == order_id?.toString()
    ) {
      const office_to_be_in_charge = await Offices.aggregate([
        { $match: { is_active: true } },
        { $addFields: { orderCount: { $size: "$orders" } } },
        { $sort: { orderCount: 1 } }, // smallest first
        { $limit: 1 },
      ]);
      const transaction = await Transaction.findOneAndUpdate(
        { order_id: order?._id },
        {
          status: "completed",
          payment_method: "Paystack",
        }
      );
      await Cart.findOneAndUpdate(
        { user_id: user?.id, order_id },
        {
          items: [],
        }
      );
      const log = await logActivity({
        req: _req,
        user_id: user?.id,
        action: "COMPLETED_PAYMENT",
        description: `User completed payment for this order, id: ${order?.order_number} and the payment was successful`,
        receiver: user._id,
        sender: new Types.ObjectId(`${user._id}`),
        metadata: {
          order_id,
          total_amount: order.total_amount,
          payment_status: "paid",
          payment_reference: response.data?.data?.reference,
          transaction_id: transaction?.transaction_id,
        },
      });
      // Log that order was asssinged to this office
      const officeLog = await logActivity({
        req: _req,
        user_id: user?._id,
        action: "ASSIGNED_ORDER_TO_OFFICE",
        description: `Order ${order_id} has been assigned to office ${office_to_be_in_charge[0]?.name}`,
        receiver: office_to_be_in_charge[0]?._id || user._id,
        sender: new Types.ObjectId(`${user._id}`),
        metadata: {
          order_id,
          office_id: office_to_be_in_charge[0]?._id,
          office_name: office_to_be_in_charge[0]?.name,
        },
      });

      await Offices.findByIdAndUpdate(office_to_be_in_charge[0]?._id, {
        $push: {
          orders: new Types.ObjectId(order?.id),
          logs: {
            $each: [
              new Types.ObjectId(log.id),
              new Types.ObjectId(officeLog.id),
            ],
          },
        },
      });

      // return;
      await Order.findOneAndUpdate(
        { order_number: order_id },
        {
          payment_status: "paid",
          delivery_status: "processing",
          status: "processing",
          payment_method: "Paystack",
          payment_reference: response.data?.data?.reference,
          $push: {
            logs: {
              $each: [log._id, officeLog.id],
            },
          },
          assigned_to: {
            office: office_to_be_in_charge[0]?._id || null,
            office_worker: null,
          },
        }
      );

      await User.findByIdAndUpdate(user._id, {
        $push: {
          logs: {
            $each: [
              new Types.ObjectId(log.id),
              new Types.ObjectId(officeLog.id),
            ],
          },
        },
        $inc: {
          total_boxes_in_stock: Number(order?.total_quantity || 0),
        },
      });

      //   find the cart and delete it items array, if the id is in items then delete the collection
      await Cart.findOneAndUpdate(
        { user_id: user?.id, order_id },
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
        user_id: user?.user_id,
        user_name: user.username,
        user_email: user.email,
        order_details: {
          total_amount: order && order.total_amount,
          payment_status: order && order.payment_status,
          delivery_status: order && order.delivery_status,
        },
      });
      return;
    }
    if (statusMap[status] === "pending") {
      const log = await logActivity({
        req: _req,
        user_id: user?._id,
        action: "VERIFIED_PAYMENT",
        description: `User verified payment for this order, id: ${order?.user_id} but the payment is still pending`,
        receiver: user._id,
        sender: new Types.ObjectId(`${user._id}`),
        metadata: {
          order_id,
          total_amount: order.total_amount,
          payment_status: "pending",
          payment_reference: response.data?.data?.reference,
        },
      });
      await Order.findByIdAndUpdate(order_id, {
        $push: { logs: new Types.ObjectId(log.id) },
      });

      await User.findByIdAndUpdate(user._id, {
        $push: { logs: new Types.ObjectId(log.id) },
      });

      successResponse(res, 202, "Payment is pending", {
        order_id,
        user_id: user?.user_id,
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
      const log = await logActivity({
        req: _req,
        user_id: user?._id,
        action: "FAILED_PAYMENT",
        description: `User payment for this order, id: ${order?.order_number} has failed or been reversed`,
        receiver: user._id,
        sender: new Types.ObjectId(`${user._id}`),
        metadata: {
          order_id,
          total_amount: order.total_amount,
          payment_status: "failed",
          payment_reference: response.data?.data?.reference,
        },
      });
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
        user_id: user?.user_id,
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
    errorResponse(res, 400, "Payment Not Confirmed", {
      order_id,
      user_id: user?.user_id,
      user_name: user.username,
      user_email: user.email,
      order_details: {
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        delivery_status: order.delivery_status,
      },
    });
    return;
  } catch (error: any) {
    console.error("Error initiating payment:", error?.response?.data || error);
    res.status(500).json({
      message: "An error occurred while Verifying payment",
      error: error || "Internal Server Error",
    });
  }
};
