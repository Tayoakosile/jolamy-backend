import { Response } from "express";
import Offices from "../../models/Admin/Office";
import CashFlow from "../../models/CashFlow";
import Order from "../../models/Order";
import { Product } from "../../models/Product";
import Transaction from "../../models/Transaction";
import User from "../../models/User";
import { AuthRequest } from "../../types/type";
import { errorResponse, successResponse } from "../../utils/response";
import { getTrend } from "../../utils/trend.util";
import { transactions } from "../../utils/util";

export const getStats = async (_req: AuthRequest, res: Response) => {
  // get total users, total products, total orders, total cash flow in an object from mongoose db
  try {
    const totalUsers = await getTrend(User, {
      period: "week",
      filter: { user_role: { $ne: "admin" } },
      // Exclude admin users
    });
    const totalProducts = await getTrend(User, {
      period: "week",
    });
    const totalOrders = await getTrend(Order, {
      period: "week",
    });
    const totalOffices = await getTrend(Offices, {
      period: "week",
    });
    //   How to add total amount from all cashflow
    const totalTransactions = await getTrend(Offices, {
      period: "week",
        sumField: "amount",
    });
    const totalCashFlow = await getTrend(CashFlow, {
      period: "week",
      sumField: "amount",
    });

    console.log("totalUsers :", totalTransactions, totalUsers, totalProducts);
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
