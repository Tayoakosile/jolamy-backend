import dayjs from "dayjs";

import { Request, Response } from "express";
import Bonus from "../models/Bonus";
import { Product } from "../models/Product";
import SalesAgentOrder from "../models/SalesAgentOrders";
import { IOrder } from "../types/order.type";
import { AuthRequest, IUser } from "../types/type";
import { successResponse } from "../utils/response";
import { generateRandom } from "../utils/util";

import isBetween from "dayjs/plugin/isBetween";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import Notification from "../models/Notification";
dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(isBetween);
dayjs.tz.setDefault("Africa/Lagos");

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const _req = req as AuthRequest;
    const notifications = await Notification.find({
      user: _req.user?._id,
    }).sort({ created_at: -1 });

    successResponse(res, 200, "notifications_fetched_successfully", {
      notifications: notifications || [],
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
};
export const updateNotificationReadStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const _req = req as AuthRequest;
    const param = _req.params.id;

    await Notification.findOneAndUpdate(
      {
        notification_id: param,
        user_id: _req.user?._id,
      },
      {
        read_at: new Date(),
        is_read: true,
      }
    );

    successResponse(res, 200, "notification_updated_successfully", {
      notification_id: param,
    });
  } catch (error) {}
};
