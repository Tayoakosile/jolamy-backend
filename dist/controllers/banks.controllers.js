"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyBankAccount = exports.getBanks = void 0;
const paystack_1 = require("../utils/paystack");
const response_1 = require("../utils/response");
const getBanks = async (req, res) => {
    const getBanks = await paystack_1.JOL_Paystack_API.get("/bank");
    //   const getBanks = await JOL_Paystack_API.get("/bank");
    const banks = getBanks.data?.data?.map((bank) => {
        return {
            ...bank,
            label: bank?.name,
            value: bank?.code,
        };
    });
    (0, response_1.successResponse)(res, 200, "Banks fetched successfully", {
        banks: banks || [],
    });
};
exports.getBanks = getBanks;
const verifyBankAccount = async (req, res) => {
    try {
        const body = req.query;
        const getBanks = await paystack_1.JOL_Paystack_API.get(`/bank/resolve?account_number=${body?.account_number}&bank_code=001`);
        // const getBanks = await JOL_Paystack_API.get(
        //   `/bank/resolve?account_number=${body?.account_number}&bank_code=${body?.bank_code}`
        // );
        (0, response_1.successResponse)(res, 200, "Bank account verified successfully", {
            account: getBanks.data?.data,
        });
    }
    catch (error) {
        console.log(":error", error?.response);
        (0, response_1.errorResponse)(res, 500, "Error verifying bank account", {
            error: error.response?.data || "Error verifying bank account",
        });
    }
};
exports.verifyBankAccount = verifyBankAccount;
