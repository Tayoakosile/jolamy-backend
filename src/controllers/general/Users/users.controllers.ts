import { Request, Response } from "express";
import User from "../../../models/User";
import { AuthRequest, IUser } from "../../../types/type";
import { successResponse } from "../../../utils/response";
import { checkIfDocumentExistsById } from "../../../utils/util";
// import { getTrend } from "../../../utils/trend.util";
import { Types } from "mongoose";
import Bonus from "../../../models/Bonus";
import Order from "../../../models/Order";
import Transaction from "../../../models/Transaction";
import { getTrend } from "../../../utils/trend.util";
import SalesAgentOrder from "../../../models/SalesAgentOrders";
import path from "path";

export const getPendingUsers = async (_req: Request, res: Response) => {
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
      User
    );
    const user_details = (await User.findOne({
      user_id: param,
    })
      .populate({
        path: "orders",
        model: "SalesAgentOrder",
      })
      .populate("logs")
      .populate("transaction_history")
      .populate({
        path: "bonus",
        select:
          " -__v -internal_sequence -payment_account_details -recipients -logs",
      })) as IUser;
    const users_bonus = user_details?.bonus?.map((bonus) => {
      return user?.is_distributor
        ? {
            ...bonus.toObject(),
            user_id: bonus?.recipients?.distributor,
            is_paid: bonus?.is_paid?.distributor || false,
            total_bonus_earned:
              bonus?.total_bonus_earned?.distributor_bonus_per_box || 0,
            total_amount: bonus?.total_amount?.distributor || 0,
            payment_status: bonus?.payment_status?.distributor || "pending",
            period: `${bonus?.period?.start_date?.toDateString()} - ${bonus?.period?.end_date?.toDateString()}`,
            payment_confirmed: bonus?.payment_confirmed?.distributor || false,
          }
        : {
            ...bonus.toObject(),
            user_id: bonus?.recipients?.sales_agent,
            is_paid: bonus?.is_paid?.sales_agent || false,
            payment_confirmed: bonus?.payment_confirmed?.sales_agent || false,
            total_bonus_earned:
              bonus?.total_bonus_earned?.sales_agent_bonus_per_box || 0,
            total_amount: bonus?.total_amount?.sales_agent || 0,
            payment_status: bonus?.payment_status?.sales_agent || "pending",
            period: `${bonus?.period?.start_date?.toDateString()} - ${bonus?.period?.end_date?.toDateString()}`,
          };
    });

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

    const order = await getTrend(
      user?.is_distributor ? Order : SalesAgentOrder,
      {
        period,
        filter: { user_id },
      }
    );

    const pending_orders = await getTrend(
      user?.is_distributor ? Order : SalesAgentOrder,
      {
        period,
        filter: {
          user_id: user && new Types.ObjectId(user?.id),
          status: { $in: ["pending", "processing"] },
        },
      }
    );

    const completed_orders = await getTrend(
      user?.is_distributor ? Order : SalesAgentOrder,
      {
        period,
        filter: { user_id, status: "completed" },
      }
    );
    const bonus = await getTrend(Bonus, {
      period,
      filter: user?.is_distributor
        ? {
            recipients: {
              distributor: user?._id,
            },
          }
        : {
            recipients: {
              sales_agent: user?._id,
            },
          },
      // sumField: "total_amount.distributor",
    });

    // console.log('bonus :', bonus);

    const transactions = await getTrend(Transaction, {
      period,
      filter: { user_id },
      sumField: "total",
    });

    successResponse(res, 200, "User fetched successfully", {
      user: { ...user_details?.toObject(), bonus: users_bonus },
      // user: { ...user_details, bonus: users_bonus },
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
    console.log(" :", error);

    return res.status(500).json({ error: "Error fetching user" });
  }
};
