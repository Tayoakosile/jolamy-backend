import { Response } from "express";
import Offices from "../../models/Admin/Office";
import CashFlow from "../../models/CashFlow";
import Order from "../../models/Order";
import User from "../../models/User";
import { AuthRequest } from "../../types/type";
import { errorResponse, successResponse } from "../../utils/response";
import { getTrend } from "../../utils/trend.util";

export const getStats = async (_req: AuthRequest, res: Response) => {
  // get total users, total products, total orders, total cash flow in an object from mongoose db
  try {
    const totalUsers = await getTrend(User, {
      period: "month",
      filter: { user_role: { $ne: "admin" } },

    });
    const totalProducts = await getTrend(User, {
      period: "month",
    });
    const totalOrders = await getTrend(Order, {
      period: "month",
    });
    const totalOffices = await getTrend(Offices, {
      period: "month",
    });
    //   How to add total amount from all cashflow
    const totalTransactions = await getTrend(Offices, {
      period: "month",
        sumField: "amount",
    });
    const totalCashFlow = await getTrend(CashFlow, {
      period: "month",
      sumField: "amount",
    });

    console.log("totalOrders :", totalOrders, totalUsers, totalProducts);
    successResponse(res, 200, "Stats fetched successfully", [
      { title: "Users", ...totalUsers },
      { title: "Products", ...totalProducts },
      { title: "Orders", ...totalOrders },
      { title: "Offices", ...totalOffices },
      { title: "Transactions", ...totalTransactions, type: "currency" },
      { title: "Cash Flow", ...totalCashFlow, type: "currency" },
    ]);
  } catch (error) {
    errorResponse(res, 500, "Error fetching stats");
  }
};
