import { Response } from "express";
import User from "../../../models/User";
import { AuthRequest } from "../../../types/type";
import { successResponse } from "../../../utils/response";
import { checkIfDocumentExistsById } from "../../../utils/util";
// import { getTrend } from "../../../utils/trend.util";
import Bonus from "../../../models/Bonus";
import Order from "../../../models/Order";
import Transaction from "../../../models/Transaction";

export const getSingleUser = async (_req: AuthRequest, res: Response) => {
  // Get all users not admin
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
    console.log('user :', user?.id,param);

    const order = await getTrend(Order, {
      period: "month",
      filter: { user_id: user && user?.id },
    });
    console.log('order :', order);

    const pending_orders = await getTrend(Order, {
      period: "month",
      filter: { user_id: user && user?.id, status: "pending" },
    });
    const completed_orders = await getTrend(Order, {
      period: "month",
      filter: { user_id: user && user?.id, status: "completed" },
    });
    const bonus = await getTrend(Bonus, {
      period: "month",
      filter: { user_id: user && user?.id },
      sumField: "amount",
    });
    const transaction = await getTrend(Transaction, {
      period: "month",
      filter: { user_id: user && user?.id },
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
