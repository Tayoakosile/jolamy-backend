import { Request, Response } from "express";
import { ActivityLog } from "../models/ActivityLog";
import User from "../models/User";

import { signupService } from "../services/auth.service";
import { sendEmail } from "../services/mail.service";
import { encrypt, isMatch } from "../utils/bcrypt.util";
import { generateToken } from "../utils/jwt";
import { errorResponse, successResponse } from "../utils/response";
import { IUser } from "../types/type";
import { getRandom } from "../utils/util";
import { logActivity } from "../utils/activityLog";

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

export const loginAccount = async (req: Request, res: Response) => {
  try {
    // return;

    if (!req.body || !req.body.email || !req.body.password) {
      errorResponse(res, 400, "Email and password are required");
    }
    const email = req.body?.email;
    const password = req.body?.password;
    const user = (await User.findOne({ email })) as IUser;
    if (!user) {
      errorResponse(res, 404, "User not found with this email", {
        message: "User not found with this email",
      });
    }
    if (user.status === "disabled" || user.status === "rejected") {
      errorResponse(res, 403, "User account is inactive", {
        message: "User account is inactive. Please contact support.",
        status: user.status,
      });
    }

    const comparePassword = await isMatch(password, user.password);

    if (!comparePassword) errorResponse(res, 401, "invalid Email or Password");

    const token = generateToken(`${user._id}`);
    const activityLog = await logActivity({
      req,
      userId: `${user._id}`,
      action: "LOGIN",
      description: "User logged in successfully",
      metadata: {
        email: user.email,
        userId: user._id,
      },
    });

    await User.findByIdAndUpdate(user._id, {
      last_login: new Date(),
      is_first_login: user.last_login ? false : true,
      $push: { logs: activityLog._id },
    });
    await sendEmail(
      "" + user.email,
      "Login Notification",
      "You have successfully logged in to your account."
    );

    successResponse(res, 200, "Login successful", {
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    errorResponse(res, 500, "An error occurred during login", error);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    if (!req.body || !req.body.email)
      errorResponse(res, 400, "Email is required");
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 401, "No user found with that email");
    }

    // Generate reset token
    const resetToken = getRandom();
    user.forgot_password_token = resetToken;
    user.forgot_password_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    const resetURL = `https://your-frontend.com/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "Password Reset Request",
      "To reset your password, please click the link below:\n\n" + resetURL
    );

    successResponse(res, 200, "Reset link sent to your email");
  } catch (error) {
    errorResponse(
      res,
      500,
      "An error occurred while processing your request",
      error
    );
  }
};
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    console.log("req.body :", req.body);

    const user = await User.findOne({
      forgot_password_token: token,
      forgot_password_expires: { $gt: new Date() },
    });

    if (!user) {
      return errorResponse(res, 400, "Invalid or expired reset token");
    }

    const newPassword = await encrypt(password);
    const activityLog = await logActivity({
      req,
      userId: `${user._id}`,
      action: "PASSWORD_RESET",
      description: "User password reset successfully",

      metadata: {
        email: user.email,
        userId: user._id,
      },
    });
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        forgot_password_expires: "",
        forgot_password_token: "",
        password: newPassword,
        $push: { logs: activityLog._id },
      }
    );
    await sendEmail(
      "" + user.email,
      "Password Reset Confirmation",
      "Your password has been reset successfully."
    );

    successResponse(res, 200, "Password has been reset successfully");
  } catch (error) {
    return errorResponse(
      res,
      500,
      "An error occurred while resetting the password",
      error
    );
  }
};
