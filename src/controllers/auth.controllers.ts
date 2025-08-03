import { Request, Response } from "express";
import { signupService } from "../services/auth.service";
import { sendEmail } from "../services/mail.service";
import { errorResponse, successResponse } from "../utils/response";

export const createAccount = async (req: Request, res: Response) => {
  try {
    const user = await signupService(
      {
        ...req.body,
        status: "pending_for_documents",
        is_distributor: req.body.user_role === "distributor",
        is_admin: req.body.user_role === "admin",
        is_sales_agents: req.body.user_role === "sales_agent",
        is_worker: req.body.user_role === "worker",
      },
      req.body.password
    );
    sendEmail(
      req.body.email,
      "Welcome to Our Service",
      `Hello ${user.name}, welcome to our service!`
    );

    successResponse(res, 201, "User created successfully");
  } catch (error: { error: string } | any) {
    console.log("error here :", error);
    errorResponse(res, 400, error as string, error);
  }
};


export const loginAccount = async (_: Request, res: Response) => {
  res.json("yooo");
};
