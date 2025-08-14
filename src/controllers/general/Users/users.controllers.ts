import { Response } from "express";
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

export const getPendingUsers = async (_req: AuthRequest, res: Response) => {
  const users = await User.find({ status: "pending" });
  return res.status(200).json({ users });
};
export const getAllUsers = async (_req: AuthRequest, res: Response) => {
  // Get all users not admin
  const period = "week";
  const user = _req.user;
  try {
    if (user?.is_admin) {
      const users = await User.find({ user_role: { $ne: "admin" } }).select(
        "-_id -password -internal_sequence  -updatedAt -__v -logs -transaction_history"
      );
      const allDistributors = await getTrend(User, {
        period,
        filter: { user_role: "distributor" },
      });
      const allSalesAgents = await getTrend(User, {
        period,
        filter: { user_role: "sales_agent" },
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
export const getSingleUser = async (_req: AuthRequest, res: Response) => {
  // Get all users not admin
  const period = "week";

  try {
    const userInfo = _req.user;
    const param = _req.params.id;
    const user = await checkIfDocumentExistsById(
      param as string,
      "user_id",
      res,
      User,
      ["logs", "orders", "transaction_history", "approved_by"]
    );

    const user_id = user && new Types.ObjectId(user?._id);
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
    const transaction = await getTrend(Transaction, {
      period,
      filter: { user_id },
      sumField: "amount",
    });

    successResponse(res, 200, "User fetched successfully", {
      user,
      stats: [
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
          ...transaction,
        },
      ],
    });
    return;
  } catch (error) {
    console.log("error :", error);

    return res.status(500).json({ error: "Error fetching user" });
  }
};
