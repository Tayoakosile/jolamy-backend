import dayjs from "dayjs";
import { Request, Response } from "express";
import { Types } from "mongoose";
import Bonus from "../../models/Bonus";
import { Cart } from "../../models/Cart";
import { Product } from "../../models/Product";
import SalesAgentOrder, {
  ISalesAgentOrder,
} from "../../models/SalesAgentOrders";
import User from "../../models/User";
import { sendEmail } from "../../services/mail.service";
import { AuthRequest, IUser } from "../../types/type";
import { logActivity } from "../../utils/activityLog";
import { errorResponse, successResponse } from "../../utils/response";
import { getIO } from "../../utils/socket";
import {
  checkIfDocumentExistsById,
  deleteCartComp,
  generateRandom,
} from "../../utils/util";

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

  const salesAgentDetails = await User.findById(order?.user_id?._id).select(
    "name email phone_number user_id"
  );

  if (!order) return;

  const otp = generateRandom(6, "0");
  console.log(
    "order?.collection_otp?.length  :",
    order,
    order?.collection_otp?.length,
    order?.collection_otp
  );

  const otpRecord =
    order?.collection_otp?.length >= 1 ? { code: order?.collection_otp } : null;

  const otpContainer = async (code: string) => {
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

    successResponse(res, 200, "OTP already generated", {
      message: "OTP already generated",
    });
    return otp;
  };

  const hasOtpExpired = dayjs().isAfter(dayjs(order?.collection_otp_expiry));
  console.log("hasOtpExpired :", hasOtpExpired);

  if (!otpRecord || hasOtpExpired) {
    await SalesAgentOrder.findOneAndUpdate(
      { order_number: order?.order_number },
      {
        collection_otp: otp,
        collection_otp_expiry: dayjs().add(5, "minute").toDate(),
      }
    );
    otpContainer(otp as string);
    return;
  }

  if (otpRecord?.code) {
    await SalesAgentOrder.findByIdAndUpdate(order?._id, {
      collection_otp: "",
      collection_otp_expiry: null,
    });
    otpContainer(otpRecord.code);

    return;
  }

  otpContainer(otp);

  return otp;
};

export const verifyOrderCollectionOtp = async (
  _req: Request,
  res: Response
) => {
  const req = _req as AuthRequest;
  const order = req.order as ISalesAgentOrder;
  const otp = req.query?.otp;

  const isOtpEqual = otp === req.order?.collection_otp;

  if (!isOtpEqual) {
    errorResponse(res, 400, "Invalid or incorrect code");
    return;
  }

  const bonus = await runBonuses(res, order);

  // sales_agent
  await User.updateOne(
    { _id: order?.user_id?._id }, // condition
    {
      $inc: { total_boxes_in_stock: order.total_quantity },
      $push: {
        bonus: bonus?._id,
      },
    }
  );
  await User.updateOne(
    { _id: order?.assigned_to?.distributor?._id }, // condition
    {
      $push: {
        bonus: bonus?._id,
      },
      $inc: {
        total_boxes_in_stock: order.total_quantity
          ? -order?.total_quantity
          : order?.assigned_to?.distributor?.total_boxes_in_stock,
      },
    } // increment by 5
  );

  let carts = await Cart.findOne({
    user: order?.user_id,
  });
  if (carts && carts?._id) {
    carts.items = deleteCartComp(order.products, carts);
    carts.save();
  }

  const salesAgentEmail = `Hi ${order?.user_id?.first_name},


Great news! The distributor has confirmed that your order has been successfully collected. We hope you enjoy your purchase. 🎁

If you encounter any issues with your items, please contact our support team immediately.

✨ In addition, you’ve earned a bonus for this order! You can check the Bonus Section in your account to view the details.

Thank you for choosing us,`;

  const distributorEmail = `Hello ${order?.assigned_to?.distributor?.name},

This is to confirm that the sales agent has successfully collected the order from your store. Thank you for your cooperation in ensuring a smooth pickup process.

If you notice any discrepancies or issues regarding this collection, kindly contact our support team immediately. Otherwise, no further action is required on your part.

We appreciate your continued partnership.
`;
  await sendEmail(
    order?.user_id?.email,
    "Order Collected + Bonus Earned",
    salesAgentEmail
  );
  await sendEmail(
    order?.assigned_to?.distributor?.email as string,
    "Order Collected + Bonus Earned",
    distributorEmail
  );

  const log = await logActivity({
    req,
    user_id: order?.assigned_to?.distributor?._id,
    action: "Complete Order",
    description: "",
    sender: order?.assigned_to?.distributor?._id,
    receiver: new Types.ObjectId(order?.user_id?._id),
  });
  await SalesAgentOrder.findByIdAndUpdate(order?._id, {
    status: "completed",
    $push: {
      delivery_steps: {
        label: "order_collected",
        date: new Date(),
        updated_by: {
          type: "system",
        },
      },
      delivery_steps_logs: {
        label: "order_collected",
        date: new Date(),
        updated_by: {
          type: "system",
        },
      },
      logs: log._id,
    },
    collection_otp: "",
    collection_otp_expiry: null,
    delivery_status: "order_collected",
  });
  successResponse(res, 200, "Order collection confirmed successfully", {
    message: "Order collection confirmed successfully",
  });
};

export const runBonuses = async (res: Response, order: ISalesAgentOrder) => {
  try {
    const productsInOrder = order.products.map((p) => p.product_id); // extract ids

    // fetch all product details
    const products = await Product.find({
      _id: { $in: productsInOrder },
    });
    const all_product_bonus = products.reduce(
      (acc, item) => {
        acc.sales_agent_bonus_per_box += item.sales_agent_bonus_per_box || 0;
        acc.distributor_bonus_per_box += item.distributor_bonus_per_box || 0;
        return acc;
      },
      { sales_agent_bonus_per_box: 0, distributor_bonus_per_box: 0 }
    );

    const distributorInfo = order?.assigned_to?.distributor as IUser;
    const sales_agent_info = order?.user_id as IUser;
    const lastFriday = dayjs().day(5).subtract(1, "week").startOf("day");
    const thisThursday = dayjs().day(4).startOf("day");

    if (!order) return;

    // const allTransferRecipients = await JOL_Paystack_API.post(
    //   "/transferrecipient/bulk",
    //   JSON.stringify(paymentAccountDetails)
    // );
    // const paymentReferenceArray = allTransferRecipients?.data?.data?.success;

    const orderQuantity = order.total_quantity ?? 0;

    let update = {
      recipients: {
        distributor: order?.assigned_to?.distributor?._id,
        sales_agent: sales_agent_info?._id,
      },
      payment_account_details: {
        distributor: distributorInfo?.account_details,
        sales_agent: sales_agent_info?.account_details,
      },
      bonus_type: "sales_target",
      description: " Bonus for order " + order.order_number,
      no_of_boxes_sold: orderQuantity,
      total_bonus_earned: all_product_bonus,
      order: order?._id,
      total_amount: {
        distributor:
          all_product_bonus.distributor_bonus_per_box * orderQuantity,
        sales_agent:
          all_product_bonus.sales_agent_bonus_per_box * orderQuantity,
      },
      period: {
        start_date: lastFriday.toDate(),
        end_date: thisThursday.toDate(),
      },
    };

    const BonusReq = await Bonus.create(update);
    return BonusReq;
  } catch (error: any) {
    errorResponse(res, 500, "Internal server error");
    console.log("error :", error);
  }
};
