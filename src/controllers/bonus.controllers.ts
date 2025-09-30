import dayjs from "dayjs";

import Bonus from "../models/Bonus";
import { Product } from "../models/Product";
import SalesAgentOrder from "../models/SalesAgentOrders";
import { IOrder } from "../types/order.type";
import { AuthRequest, IUser } from "../types/type";
import { JOL_Paystack_API } from "../utils/paystack";
import { Request, Response } from "express";
import { successResponse } from "../utils/response";
import { generateRandom } from "../utils/util";

import isBetween from "dayjs/plugin/isBetween";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(isBetween);
dayjs.tz.setDefault("Africa/Lagos");

export const runBonuses = async () => {
  try {
    const products = await Product.find({});

    const orders = await SalesAgentOrder.find()
      .populate("assigned_to.distributor")
      .populate("user_id");
    const order = orders[orders?.length - 1] as IOrder;
    const distributorInfo = order?.assigned_to?.distributor as IUser;
    const sales_agent_info = order?.user_id as IUser;
    const product = products[products?.length - 1];
    const lastFriday = dayjs().day(5).subtract(1, "week").startOf("day");
    const thisThursday = dayjs().day(4).startOf("day");

    // Output
    console.log("Last Friday:", lastFriday.format("YYYY-MM-DD"));
    console.log("This Thursday:", thisThursday.format("YYYY-MM-DD"));
    console.log("sales_agent_info", sales_agent_info);

    //   console.log("distributorInfo :", distributorInfo);
    //   ({
    //     "type": "nuban",
    //     "name": "Tolu Robert",
    //     "account_number": "01000000010",
    //     "bank_code": "058",
    //     "currency": "NGN"
    //   })

    // console.log("distributorInfo :", distributorInfo);

    // return;
    const paymentAccountDetails = {
      batch: [
        {
          type: "nuban",
          name: " Oluwatayo Samuel Akosile ",
          account_number: "8126741053",
          bank_code: "044",
          //   bank_code: "999992",
          currency: "NGN",
          metadata: {
            user_id: distributorInfo?.user_id,
            email: distributorInfo?.email,
            name: `${distributorInfo?.first_name} ${distributorInfo?.last_name}`,
            phone: distributorInfo?.phone_number,
            role: distributorInfo?.user_role,
          },
        },
        {
          type: "nuban",
          name: `${sales_agent_info?.first_name} ${sales_agent_info?.last_name}`,
          account_number: "8126741053",
          bank_code: "058",
          //   bank_code: "058",
          currency: "NGN",
        },
      ],
    };

    if (!order) return;
    // console.log('paymentAccountDetails :', paymentAccountDetails);

    const transferRecipient = await JOL_Paystack_API.post(
      "/transferrecipient/bulk",
      JSON.stringify(paymentAccountDetails)
    );

    const transferRecipientCode = transferRecipient.data.data?.success;
    console.log("transferRecipientCode :", transferRecipientCode);
    return;
    const orderQuantity = order.total_quantity ?? 0;
    const distributor_bonus_per_box = product.distributor_bonus_per_box;

    let update = {
      recipients: {
        distributor: order?.assigned_to?.distributor?._id,
        sales_agent: order?.user_id,
      },
      payment_account_details: {
        distributor: {
          bank_name: "Guaranty Trust Bank",
          account_number: "0123456789",
          account_name: "Jolamy Distributors Ltd",
        },
        sales_agent: {
          bank_name: "Guaranty Trust Bank",
          account_number: "0123456789",
          account_name: "Jolamy Distributors Ltd",
        },
      },
      total_bonus_earned: {
        distributor: 3000,
        sales_agent: 3000,
      },
      bonus_type: "sales_target",
      role: distributorInfo?.user_role,
      description: " Bonus for order " + order.order_number,
      no_of_boxes_sold: orderQuantity,
      bonus_per_box: distributor_bonus_per_box,
      total_bonus_earned: distributor_bonus_per_box * orderQuantity,
      total_amount: {
        distributor: distributor_bonus_per_box * orderQuantity,
        sales_agent: distributor_bonus_per_box * orderQuantity,
      },
      period: {
        start_date: lastFriday.toDate(),
        end_date: thisThursday.toDate(),
      },
    };
    const BonusReq = await Bonus.create(update);
    console.log("BonusReq :", BonusReq);
  } catch (error: any) {
    console.log("error :", error?.response.data);
  }
};

export const getSingleBonus = async (req: Request, res: Response) => {
  try {
    const _req = req as AuthRequest;
    const param = _req.params.id;

    const user_id = _req.user?._id;

    const bonus = await Bonus.findOne({
      bonus_id: param,
      $or: [
        { "recipients.distributor": user_id },
        { "recipients.sales_agent": user_id },
      ],
    })
      .populate({
        path: "recipients.distributor",
        select: "first_name last_name email phone_number user_role",
      })
      .populate({
        path: "recipients.sales_agent",
        select: "first_name last_name email phone_number user_role",
      });

    if (!bonus) return;
    const updatedBonus = _req.user?.is_distributor
      ? {
          ...bonus.toObject(),
          user: bonus?.recipients?.distributor,
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
          user: bonus?.recipients?.sales_agent,
          is_paid: bonus?.is_paid?.sales_agent || false,
          payment_confirmed: bonus?.payment_confirmed?.sales_agent || false,
          total_bonus_earned:
            bonus?.total_bonus_earned?.sales_agent_bonus_per_box || 0,
          total_amount: bonus?.total_amount?.sales_agent || 0,
          payment_status: bonus?.payment_status?.sales_agent || "pending",
          // period: `${bonus?.period?.start_date?.toDateString()} - ${bonus?.period?.end_date?.toDateString()}`,
        };

    delete updatedBonus.recipients;

    successResponse(res, 200, "bonus_fetched_sucessfully", {
      bonus: updatedBonus,
    });
  } catch (error) {}
};

export const runBonusPayment = () => {
  // console.log(" working on bonus update:");
  const timeZonedDayjs = dayjs().tz();
  // call your bonus calculation service here
  const calculateBonuses = async () => {
    const lastFriday = timeZonedDayjs.day(5).subtract(1, "week").startOf("day");
    const thisThursday = timeZonedDayjs.day(4).startOf("day");
    // console.log("lastFriday :", lastFriday.format("YYYY-MM-DD"));
    // console.log("thisThursday :", thisThursday.format());

    console.log("bonuses :");
    const pendingBonuses = await Bonus.find({
      payment_status: {
        distributor: "unpaid",
        sales_agent: "unpaid",
      },
    });

    // console.log("pendingBonuses :", pendingBonuses.length);

    const result: any = [];
    const transactions = pendingBonuses
      .map((bonus) => {
        const distributor_reference = `acv_${
          bonus.bonus_id
        }_${generateRandom()}_${bonus.recipients.distributor}`;
        const sales_agent_reference = `acv_${
          bonus.bonus_id
        }_${generateRandom()}_${bonus.recipients.distributor}`;

        const paymentBatchDetails = [
          {
            amount: bonus.total_amount.distributor * 100,
            reason: " Bonus Payment - Distributor",
            reference: distributor_reference,
            recipient:
              bonus.payment_account_details?.distributor
                .paystack_payment_reference,
          },
          {
            amount: bonus.total_amount.sales_agent * 100,
            reason: " Bonus Payment - Sales Agent",
            reference: sales_agent_reference,
            recipient:
              bonus.payment_account_details?.sales_agent
                .paystack_payment_reference,
          },
        ];
        console.log("paymentBatchDetails :", paymentBatchDetails);

        const startingPeriod = dayjs(bonus.period.start_date).isBetween(
          lastFriday,
          thisThursday,
          null,
          "[]"
        );

        const endPeriod = dayjs(bonus.period.end_date).isBetween(
          lastFriday,
          thisThursday,
          null,
          "[]"
        );

        // const paymentDetails = {
        //   source: "balance",
        // reason: "Bonus Payment",
        //   amount: 100000,
        //   recipient: "RCP_gd9vgag7n5lr5ix",
        //   reference: "acv_9ee55786-2323-4760-98e2-6380c9cb3f68",
        // };
        // {
        //   "amount": 15000,
        //   "reference": "acv_11bebfc3-18b3-40aa-a4df-c55068c93457",
        //   "reason": "Bonus for the week",
        //   "recipient": "RCP_dfznnod8rwxlwgn"
        // }
        return paymentBatchDetails;
        if (startingPeriod && endPeriod) {
          // const transfer = await JOL_Paystack_API.get
          // bonus.status = "due";
          // bonus.save();
          // console.log("Bonus marked as due for bonus_id:", bonus.bonus_id);
        }
      })
      .flat()
      .forEach((item) => {
        const existing = result.find((r) => r.recipient === item.recipient);
        if (existing) {
          existing.amount += item.amount; // update the amount if recipient already exists
        } else {
          result.push({ ...item }); // otherwise insert it fresh
        }
      });
    console.log("result :", result);

    return;

    const merged = Object.values(
      transactions.reduce((acc: any, curr: any) => {
        if (!acc[curr.recipient]) {
          acc[curr.recipient] = { ...curr };
        } else {
          acc[curr.recipient].amount += curr.amount;
        }
        return acc;
      }, {})
    );

    console.log("merged :", merged);

    console.log("transactions :", transactions.flat(2));
  };
  calculateBonuses();
};
