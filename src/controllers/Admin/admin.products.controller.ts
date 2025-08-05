import { Request, Response } from "express";
import { Types } from "mongoose";
import Offices, { IOffice } from "../../models/Admin/Office";
import { IOfficeWorker, OfficeWorker } from "../../models/Admin/OfficeWorker";
import User from "../../models/User";
import { sendEmail } from "../../services/mail.service";
import { logActivity } from "../../utils/activityLog";
import { encrypt } from "../../utils/bcrypt.util";
import { errorResponse } from "../../utils/response";
import {
  checkIfDocumentExistsById,
  customReqResHandler,
} from "../../utils/util";
import { Product } from "../../models/Product";

interface AuthRequest extends Request {
  user?: {
    _id: string;
    is_admin: boolean;
    email: string;
  };
}

export const addNewProducts = (_req: AuthRequest, res: Response) => {
  const body = _req.body;

  const request = async () => {
    const existingProduct = await Product.exists({})
      .where("name")
      .equals(body.name);
    if (existingProduct) {
      return errorResponse(res, 400, "Product with this name already exists", {
        message: "Product with this name already exists",
      });
    }
    const product = await Product.create({
      ..._req.body,
      created_by: _req.user?._id,
      is_active: true,
    });

    const log = await logActivity({
      req: _req,
      userId: new Types.ObjectId(_req.user?._id),
      action: "ADD_PRODUCT",
      sender: new Types.ObjectId(_req.user?._id),
      receiver: product.id,
      description: `New product added: ${product.name}`,
      metadata: {
        productId: product._id,
      },
    });

    return { message: "Product added successfully" };
  };

  customReqResHandler(res, request);
};

export const getProducts = (_req: AuthRequest, res: Response) => {
  const request = async () => {
    return await Product.find();
  };
  customReqResHandler(res, request);
};
export const getSingleProducts = async (_req: AuthRequest, res: Response) => {};

export const updateProduct = async (req: AuthRequest, res: Response) => {};
