import dayjs from "dayjs";
import Bonus from "../models/Bonus";
import Order from "../models/Order";
import { Product } from "../models/Product";
import SalesAgentOrder from "../models/SalesAgentOrders";
import { IUser } from "../types/type";
import { IOrder } from "../types/order.type";
import { stringToBytes } from "uuid/dist/cjs/v35";
import { JOL_Paystack_API } from "../utils/paystack";

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
  } catch (error) {
    console.log("error :", error.response.data);
  }
};
