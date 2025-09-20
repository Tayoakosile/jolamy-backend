import { Request, Response } from "express";
import User from "../../models/User";
import { AuthRequest } from "../../types/type";
import { successResponse } from "../../utils/response";
import { getIO } from "../../utils/socket";
import { checkIfDocumentExistsById, generateRandom } from "../../utils/util";
import SalesAgentOrder from "../../models/SalesAgentOrders";
import dayjs from "dayjs";
import Otp from "../../models/Otp";
import { sendEmail } from "../../services/mail.service";

export const getAllDistributors = async (req: Request, res: Response) => {
  const distributors = await User.find({
    user_role: "distributor",
    status: "approved",
    is_verified: true,
    total_boxes_in_stock: { $gt: 0 },
  })
    .select(
      " -password -internal_sequence -__v -logs -transaction_history -is_admin -is_distributor -is_sales_agent -is_supervisor -is_warehouse_manager -is_worker -status -user_role -phone_number -distributor_location  -bvn -next_of_kin -total_boxes_sold -files -cart -registration_number -documents -paid_registration_fee -last_login  -approved_at -total_commission_earned -wallet -sales_agent_location -office -assigned_sales_agent"
    )
    .populate({
      path: "stock_logs",
      populate: {
        path: "order", // 👈 name of the field in stock_log that references Order // pick the fields you need
        match: { delivery_status: "order_delivered" }, // optional: only successful orders
      },
      // select: "first_name last_name email worker_id user_id role",
    });
  successResponse(res, 200, "Distributors fetched successfully", {
    distributors: distributors || [],
  });
};

export const getSingleDistributorDetails = async (
  req: Request,
  res: Response
) => {
  const _req = req as AuthRequest;
  const id = _req.params.id;
  await checkIfDocumentExistsById(id, "user_id", res, User);

  const singleUser = await User.findOne({
    user_id: id,
    user_role: "distributor",
    status: "approved",
    is_verified: true,
    total_boxes_in_stock: { $gt: 0 },
  }).populate({
    path: "stock_logs",
    populate: {
      path: "order", // 👈 name of the field in stock_log that references Order // pick the fields you need
      match: { delivery_status: "order_delivered" }, // optional: only successful orders
    },
  });
  successResponse(res, 200, "Distributor fetched successfully", {
    distributor: singleUser || {},
  });
};

export const startOrderCollectionProcess = async (
  _req: Request,
  res: Response
) => {
  const req = _req as AuthRequest;
  const order = req.order;

  const salesAgentDetails = await User.findById(order?.user_id).select(
    "name email phone_number user_id"
  );

  const otp = generateRandom(6, "0");
  const otpRecord = await Otp.findOne({
    email: salesAgentDetails?.email,
    type: "order_collection",
    // expires_at: { $gt: new Date() },
  });

  console.log("otpRecord :", otpRecord, salesAgentDetails?.email);

  const otpContainer = async (code: string) => {
    getIO()
      .to(`${order?.assigned_to?.distributor}`)
      .emit("start_order_collection_process", {
        type: "otp",
        order_id: order?._id,
      });

    getIO()
      .to(`${order?.user_id?._id}`)
      .emit("start_order_collection_process", {
        type: "otp",
        otp: code,
        order_id: order?._id,
      });

    await sendEmail(
      salesAgentDetails?.email as string,
      "Order Collection OTP",
      `Your OTP for collecting order ${order?.internal_sequence} is: ${code}. It will expire in 10 minutes.`
    );
    return otp;
  };

  if (otpRecord) {
    otpContainer(otpRecord.code);
    return;
  }

  await Otp.create({
    email: salesAgentDetails?.email,
    code: otp,
    type: "order_collection",
    expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
  });
  otpContainer(otp);
};
