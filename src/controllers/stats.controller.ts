import { Request, Response } from "express";
import Offices from "../models/Admin/Office";
import CashFlow from "../models/CashFlow";
import Order from "../models/Order";
import User from "../models/User";
import { AuthRequest } from "../types/type";
import { errorResponse, successResponse } from "../utils/response";
import { getTrend } from "../utils/trend.util";

export const getStats = async (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  // get total users, total products, total orders, total cash flow in an object from mongoose db
  const worker = _req.worker;
  const user = _req.user;
  const isUserAdmin = _req.isUserAdmin;

  if (isUserAdmin) {
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
  }

  if (_req.isWorker) {
    try {
      const totalOrders = await getTrend(Order, {
        period: "month",

        filter: {
          assigned_to: {
            office: { $eq: worker?.office },
            office_worker: { $eq: worker?._id },
            worker_handling_order: { $eq: worker?._id },
          },
        },
      });

      //   How to add total amount from all cashflow
      // const totalTransactions = await getTrend(CashFlow, {
      //   period: "month",
      //   filter: {
      //     office_id: { $eq: worker?.office },
      //     created_by: { $eq: worker?._id },
      //   },
      // });

      const totalCashFlow = await getTrend(CashFlow, {
        period: "month",
        filter: {
          type: "inflow",
          office_id: { $eq: worker?.office },
          created_by: { $eq: worker?._id },
        },
      });
      const totalInflowCashFlow = await getTrend(CashFlow, {
        period: "month",
        filter: {
          type: "inflow",
          office_id: { $eq: worker?.office },
          created_by: { $eq: worker?._id },
        },
      });
      const totalOutflowCashFlow = await getTrend(CashFlow, {
        period: "month",
        filter: {
          type: "outflow",
          office_id: { $eq: worker?.office },
          created_by: { $eq: worker?._id },
        },
      });

      successResponse(res, 200, "Stats fetched successfully", [
        { title: "Orders In Charge", ...totalOrders },
        // { title: "Transactions", ...totalTransactions, type: "currency" },
        { title: "Total Cash Flow", ...totalCashFlow },
        { title: "Total Inflow Recorded", ...totalInflowCashFlow },
        { title: "Total Outflow Recorded", ...totalOutflowCashFlow },
      ]);
    } catch (error) {
      console.log("error :", error);

      errorResponse(res, 500, "Error fetching stats");
    }
  }
};
