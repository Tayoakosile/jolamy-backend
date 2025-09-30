import { Request, Response } from "express";
import { JOL_Paystack_API } from "../utils/paystack";
import { errorResponse, successResponse } from "../utils/response";

export const getBanks = async (req: Request, res: Response) => {
  const getBanks = await JOL_Paystack_API.get("/bank");

  //   const getBanks = await JOL_Paystack_API.get("/bank");
  const banks = getBanks.data?.data?.map((bank: any) => {
    return {
      ...bank,
      label: bank?.name,
      value: bank?.code,
    };
  });

  successResponse(res, 200, "Banks fetched successfully", {
    banks: banks || [],
  });
};
export const verifyBankAccount = async (req: Request, res: Response) => {
  try {
    const body = req.query;

    const getBanks = await JOL_Paystack_API.get(
      `/bank/resolve?account_number=${body?.account_number}&bank_code=001`
    );
    // const getBanks = await JOL_Paystack_API.get(
    //   `/bank/resolve?account_number=${body?.account_number}&bank_code=${body?.bank_code}`
    // );
    successResponse(res, 200, "Bank account verified successfully", {
      account: getBanks.data?.data,
    });
  } catch (error: any) {
    console.log(":error", error?.response);
    errorResponse(res, 500, "Error verifying bank account", {
      error: error.response?.data || "Error verifying bank account",
    });
  }
};
