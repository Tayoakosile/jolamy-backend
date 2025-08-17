import { Request, Response } from "express";
import User from "../models/User";

import OfficeWorker, { IOfficeWorker } from "../models/Admin/OfficeWorker";
import { signupService } from "../services/auth.service";
import { sendEmail } from "../services/mail.service";
import { AuthRequest, IUser } from "../types/type";
import { logActivity } from "../utils/activityLog";
import { isMatch } from "../utils/bcrypt.util";
import { generateToken } from "../utils/jwt";
import { errorResponse, successResponse } from "../utils/response";
import { generateRandom } from "../utils/util";

export const createAccount = async (req: Request, res: Response) => {
  // return;
  if (!req.body) {
    errorResponse(res, 400, "Request body is required");
    return;
  }
  if (req.body.user_role === "admin") {
    errorResponse(res, 400, "Admin role cannot be created via this endpoint");
    return;
  }
  if (!req.body.email || !req.body.password) {
    errorResponse(res, 400, "Email and password are required");
    return;
  }
  try {
    const user = await signupService(
      {
        ...req.body,
        status: "pending_for_documents",
        is_distributor: req.body.user_role === "distributor",
        is_sales_agents: req.body.user_role === "sales_agent",
        is_worker: req.body.user_role === "worker",
      },
      res
    );
    sendEmail(
      req.body.email,
      "Welcome to Our Service",
      `Hello ${user.username}, welcome to our service!`
    );

    successResponse(res, 201, "User created successfully");
    return;
  } catch (error: { error: string } | any) {
    errorResponse(res, 400, error as string, error);
  }
};

export const loginAccount = async (req: Request, res: Response) => {
  try {
    const email =
      req.body?.username?.toLowerCase() || req.body?.email?.toLowerCase();
    const password = req.body?.password;

    if (!req.body || !email || !req.body.password) {
      errorResponse(res, 400, "Email and password are required");
      return;
    }

    // search username or email fields

    const officeWorker = (await OfficeWorker.findOne({
      $or: [{ email }, { username: email }],
    })) as IOfficeWorker;

    if (officeWorker) {
      const comparePassword = await isMatch(password, officeWorker.password);

      if (!comparePassword) {
        errorResponse(res, 401, "invalid Email or Password");
        return;
      }
      const token = generateToken(`${officeWorker?.worker_id}`);

      const activityLog = await logActivity({
        req,
        user_id: officeWorker.id,
        sender: officeWorker.id,
        receiver: officeWorker.id,
        action: "LOGIN",
        description: "Worker logged in successfully",
        metadata: {
          email: officeWorker.email,
          user_id: officeWorker.id,
        },
      });

      await OfficeWorker.findOneAndUpdate(
        { worker_id: officeWorker },
        {
          last_login: new Date(),
          is_first_login: officeWorker.last_login ? false : true,
          $push: { logs: activityLog._id },
        }
      );
      await sendEmail(
        officeWorker.email,
        "Login Notification",
        "You have successfully logged in to your account."
        // officeWorker.is_first_login
        //   ? "You have successfully logged in to your account for the first time. Welcome aboard!"
        //   : "You have successfully logged in to your account."
      );
      successResponse(res, 200, "Login successful", {
        token,
        user: {
          id: officeWorker.worker_id,
          email: officeWorker.email,
        },
      });
      return;
    }
    const user = (await User.findOne({
      $or: [{ email }, { username: email }],
    })) as IUser;

    if (!user) {
      errorResponse(res, 404, "User not found with this email", {
        message: "User not found with this email",
      });
      return;
    }
    if (
      user.status === "disabled" ||
      user.status === "rejected" ||
      user.rejected_by
    ) {
      errorResponse(res, 403, "User account is inactive", {
        message: "User account is inactive. Please contact support.",
        status: user.status,
        user,
      });
      return;
    }

    const comparePassword = await isMatch(password, user.password);

    if (!comparePassword) {
      errorResponse(res, 401, "invalid Email or Password");
      return;
    }

    const token = generateToken(user.user_id);

    const activityLog = await logActivity({
      req,
      user_id: user._id,
      sender: user._id,
      receiver: user._id,
      action: "LOGIN",
      description: "User logged in successfully",
      metadata: {
        email: user.email,
        user_id: user._id,
      },
    });

    await User.findByIdAndUpdate(user._id, {
      last_login: new Date(),
      is_first_login: user.last_login ? false : true,
      $push: { logs: activityLog._id },
    });
    await sendEmail(
      user.email,
      "Login Notification",
      "You have successfully logged in to your account."
    );

    successResponse(res, 200, "Login successful", {
      token,
      user: {
        id: user.user_id,
        email: user.email,
      },
    });
  } catch (error) {
    console.log("error :", error);

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
      errorResponse(res, 401, "No user found with that email");
      return;
    }

    // Generate reset token
    const resetToken = generateRandom();
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
    const token = req.params?.token;
    const password = req.body?.password;
    // Debugging information removed for production

    const user = await User.findOne({
      forgot_password_token: token,
      forgot_password_expires: { $gt: new Date() },
    });

    if (!user) {
      errorResponse(res, 400, "Invalid or expired reset token");
      return;
    }

    const activityLog = await logActivity({
      req,
      user_id: user.user_id,
      sender: user.user_id,
      receiver: user.user_id,
      action: "PASSWORD_RESET",
      description: "User password reset successfully",

      metadata: {
        email: user.email,
        user_id: user.user_id,
      },
    });
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        forgot_password_expires: "",
        forgot_password_token: "",
        password,
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
    errorResponse(
      res,
      500,
      "An error occurred while resetting the password",
      error
    );
    return;
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id || req.worker?.worker_id;
    const user = await User.findOne({ user_id: userId }).select(
      "-password -__v -_id"
    );
    const worker = await OfficeWorker.findOne({ worker_id: userId }).select(
      "-password -__v -_id"
    );

    if (!user && !worker) {
      errorResponse(res, 404, "User not found ");
      return;
    }
    successResponse(
      res,
      200,
      `${user ? "User's" : "Worker's"} profile retrieved successfully`,
      user || worker
    );
    return;
  } catch (error) {
    errorResponse(
      res,
      500,
      "An error occurred while retrieving profile",
      error
    );
  }
};
