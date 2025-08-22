import { Response } from "express";
import dayjs from "dayjs";
import _ from "lodash";
import { Types } from "mongoose";
import Offices, { IOffice } from "../../models/Admin/Office";
import { IFinance } from "../../models/CashFlow";
import User from "../../models/User";
import { AuthRequest } from "../../types/type";
import { logActivity } from "../../utils/activityLog";
import { errorResponse } from "../../utils/response";
import { getTrend } from "../../utils/trend.util";
import {
  checkIfDocumentExistsById,
  customReqResHandler,
  transactions,
} from "../../utils/util";
import { ITransaction } from "../../models/Transaction";

const getTotalCashflow = (
  data: IOffice["transactions"],
  period: "month" | "week" | "all",
  type: "outflow" | "inflow" | "",
  name: string
) => {
  if (period === "all") {
    return {
      name,
      value: Array.isArray(data) ? _.sumBy(data, "amount") : 0,
    };
  }
  return {
    name,
    value: _.sumBy(
      _.filter(data, (transaction: IFinance) => {
        const transactionDate = dayjs(transaction.created_at);
        const today = dayjs(new Date());

        const filteredData =
          period === "week"
            ? dayjs(today).subtract(7, "day")
            : dayjs(today).subtract(1, "month");
        return (
          transaction.type === type &&
          dayjs(transactionDate).isAfter(filteredData) &&
          dayjs(transactionDate).isSame(today)
        );
      }),
      "amount"
    ),
  };
};

export const getOffices = (_req: AuthRequest, res: Response) => {
  const user = _req.user;
  const request = async () => {
    if (user?.user_role === "admin") {
      const allOrders = await Offices.find({});

      const allOfficeStats = await getTrend(Offices, {
        period: "week",
      });

      const activeOffices = await getTrend(Offices, {
        period: "week",
        filter: {
          is_active: true,
        },
      });

      return {
        stats: [
          {
            title: "All Offices",
            ...allOfficeStats,
          },
          {
            title: "Active Offices",
            ...activeOffices,
          },
        ],
        offices: allOrders,
      };
    }

    const allOffices = await Offices.find({})
      .populate("logs")
      .populate("created_by");

    return allOffices;
  };

  customReqResHandler(res, request);
};

export const getSingleOffice = async (_req: AuthRequest, res: Response) => {
  const id = _req.params.id;
  const request = async () => {
    const single_office = await checkIfDocumentExistsById<IOffice>(
      id,
      "office_id",
      res,
      Offices,
      ["created_by", "logs"]
    );
    const log = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(_req.user?._id),
      action: "GET_SINGLE_OFFICE",
      description: `${_req.user?.first_name} retrieved office details for ${single_office?.name}`,
      metadata: {
        ...single_office,
        user_id: `${_req.user?._id}`,
      },
    });
    const office = (await Offices.findOne({ office_id: id })
      .populate({
        path: "created_by",
        select: "first_name last_name email user_role username email",
      })
      .populate({
        path: "logs",
        populate: [
          {
            path: "sender",
            select: "first_name last_name email user_role username",
          },
          {
            path: "receiver",
            select: "first_name last_name email user_role username",
          },
        ],
      })
      .populate({
        path: "transactions",
        populate: {
          path: "created_by",
          model: "OfficeWorker",
        },
      })
      .populate("wallet.logs")
      .populate({
        path: "workers",
        populate: [
          {
            path: "added_by", // the nested field inside workers
            model: "User",
            select: "first_name last_name email user_role username",
          },
          {
            path: "logs", // the nested field inside workers
            model: "Log",
            // select:"first_name last_name email user_role username",
          },
        ],
      })) as IOffice;

    const stats: {
      name: string;
      value: number;
    }[] = [
      getTotalCashflow(office.transactions, "all", "", "Total Transactions"),
      getTotalCashflow(
        office.transactions,
        "week",
        "inflow",
        "Total Inflow This Week"
      ),
      getTotalCashflow(
        office.transactions,
        "week",
        "outflow",
        "Total Outflow This Week"
      ),
    ];

    await User.findByIdAndUpdate(_req.user?._id, {
      $push: { logs: log._id },
    });
    return {
      stats,
      office,
    };
  };

  await customReqResHandler(res, request, undefined, {
    successMessage: "Office retrieved successfully",
    errorMessage: "Error retrieving office",
    statusCode: 200,
  });
};
/**
 *
 *
 * @param {AuthRequest} req
 * @param {Response} res
 */
export const createNewOffices = (req: AuthRequest, res: Response) => {
  const request = async () => {
    const existingOffice = await Offices.exists({})
      .where("name")
      .equals(req.body.name);
    if (existingOffice) {
      errorResponse(res, 400, "Office with this name already exists", {
        message: "Office with this name already exists",
      });
      return;
    }
    const newOffice = await Offices.create({
      ...req.body,
      created_by: req.user?._id,
    });
    const log = await logActivity({
      req,
      user_id: new Types.ObjectId(req.user?._id),
      sender: new Types.ObjectId(req.user?._id),
      receiver: new Types.ObjectId(req.user?._id),
      action: "CREATE_OFFICE",
      description: "New office created",
      metadata: {
        ...newOffice,
        user_id: `${req.user?._id}`,
      },
    });
    newOffice.logs = Array.isArray(newOffice.logs)
      ? [...newOffice.logs, log._id]
      : [log._id];
    await newOffice.save();
    await User.findByIdAndUpdate(req.user?._id, {
      $push: { logs: log._id },
    });
    return newOffice;
  };

  customReqResHandler(
    res,
    request,
    undefined,
    {
      successMessage: "New office created successfully",
      errorMessage: "Error creating new office",
      statusCode: 201,
      errorStatusCode: 400,
    },
    {
      shouldSendMail: true,
      mailTo: req.user?.email,
      title: "New Office Created",
      message: `A new office has been created with the name ${req.body.name}.`,
    }
  );
};

export const updateOffice = async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  await checkIfDocumentExistsById<IOffice>(id, "_id", res, Offices);

  const request = async () => {
    const updatedOffice = (await Offices.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    )) as IOffice;

    const log = await logActivity({
      req,
      user_id: new Types.ObjectId(req.user?._id),
      sender: new Types.ObjectId(req.user?._id),
      receiver: new Types.ObjectId(updatedOffice?._id),
      action: "UPDATE_OFFICE",
      description: "Office updated successfully",
      metadata: {
        ...updatedOffice,
        user_id: `${req.user?._id}`,
      },
    });
    updatedOffice.logs = Array.isArray(updatedOffice.logs)
      ? [...updatedOffice.logs, log._id]
      : [log._id];
    await updatedOffice.save();
    await User.findByIdAndUpdate(req.user?._id, {
      $push: { logs: log._id },
    });
    return updatedOffice;
  };

  await customReqResHandler(res, request, undefined, {
    successMessage: "Office updated successfully",
    errorMessage: "Error updating office",
    statusCode: 200,
  });
};
