import { Request, Response } from "express";
import User from "../../../models/User";
import { AuthRequest } from "../../../types/type";
import { successResponse } from "../../../utils/response";
import { checkIfDocumentExistsById } from "../../../utils/util";
// import { getTrend } from "../../../utils/trend.util";
import { Types } from "mongoose";
import Bonus from "../../../models/Bonus";
import Order from "../../../models/Order";
import Transaction from "../../../models/Transaction";
import { getTrend } from "../../../utils/trend.util";

export const getPendingUsers =  async (_req: Request, res: Response) => {
  // Get all users not admin
  const req = _req as AuthRequest;
  const users = await User.find({
    status: {
      $in: [
        "inactive",
        "pending_for_documents",
        "awaiting_registration_fee_payment",
        "submitted_for_review",
        "pending_for_approval",
      ],
    },
  });

  successResponse(res, 200, "Pending Users fetched successfully", { users });
  return;
};
export const getAllUsers = async (req: Request, res: Response) => {
  // Get all users not admin
  const _req = req as AuthRequest;
  const orderStatus = _req.query?.status;

  const period = "week";
  const user = _req.user;
  const worker = _req.worker;

  const orderStatusContained = orderStatus
    ? ["pending_for_documents", "submitted_for_review", "pending_for_approval"]
    : ["approved"];

  try {
    if (user?.is_admin) {
      const users = await User.find({
        user_role: { $ne: "admin" },
        status: {
          $in: orderStatusContained,
        },
      }).select(
        "-_id -password -internal_sequence  -updatedAt -__v -logs -transaction_history"
      );

      const allDistributors = await getTrend(User, {
        period,
        filter: {
          user_role: "distributor",
          status: orderStatus ? { $nin: ["approved", "deleted"] } : "approved",
        },
      });
      const allSalesAgents = await getTrend(User, {
        period,
        filter: {
          user_role: "sales_agent",
          status: orderStatus ? { $nin: ["approved", "deleted"] } : "approved",
        },
      });
      successResponse(res, 200, "Users fetched successfully", {
        users,
        stats: [
          {
            title: "distributor",
            ...allDistributors,
          },
          {
            title: "sales_agent",
            ...allSalesAgents,
          },
        ],
      });
    }
    return;
  } catch (error) {
    return res.status(500).json({ error: "Error fetching users" });
  }
};
export const getSingleUser = async (req: Request, res: Response) => {
  // Get all users not admin
  const _req = req as AuthRequest;
  const period = "week";

  try {
    const param = _req.params.id;
    const user = await checkIfDocumentExistsById(
      param as string,
      "user_id",
      res,
      User,
      ["logs", "orders", "transaction_history", "approved_by"]
    );

    const user_id = user && new Types.ObjectId(user?._id);
    const boxes_in_stock = {
      // {
      //   currentTotal: number;
      //   previousTotal: number;
      //   percentageChange: number;
      //   trend: "increase" | "decrease" | "no-change";
      // }
      currentTotal: `${user?.total_boxes_in_stock} Boxes` || 0,
      previousTotal: 0,
      percentageChange: 0,
      trend: "no-change" as "increase" | "decrease" | "no-change",
    };
    const order = await getTrend(Order, {
      period,
      filter: { user_id },
    });

    const pending_orders = await getTrend(Order, {
      period,
      filter: {
        user_id: user && new Types.ObjectId(user?.id),
        status: { $in: ["pending", "processing"] },
      },
    });

    const completed_orders = await getTrend(Order, {
      period,
      filter: { user_id, status: "completed" },
    });
    const bonus = await getTrend(Bonus, {
      period,
      filter: { user_id },
      sumField: "amount",
    });
    const transactions = await getTrend(Transaction, {
      period,
      filter: { user_id },
      sumField: "total",
    });

    successResponse(res, 200, "User fetched successfully", {
      user,
      stats: [
        {
          title: "Boxes in Stock",
          ...boxes_in_stock,
        },
        {
          title: "Total Orders",
          ...order,
        },
        {
          title: "Pending Orders",
          ...pending_orders,
        },
        {
          title: "Completed Orders",
          ...completed_orders,
        },
        {
          title: "Total Bonuses",
          ...bonus,
          type: "currency",
        },
        {
          title: "Total Transactions",
          type: "currency",
          ...transactions,
        },
      ],
    });
    return;
  } catch (error) {
    return res.status(500).json({ error: "Error fetching user" });
  }
};
