import { Request, Response } from "express";
import { Types } from "mongoose";
import { Product } from "../../models/Product";
import { logActivity } from "../../utils/activityLog";
import { errorResponse } from "../../utils/response";
import {
  checkIfDocumentExistsById,
  customReqResHandler,
} from "../../utils/util";
import { uploadToR2 } from "../upload-r2.controllers";
import User from "../../models/User";

interface AuthRequest extends Request {
  user?: {
    _id: string;
    is_admin: boolean;
    email: string;
  };
}

export const addNewProducts = (_req: AuthRequest, res: Response) => {
  const user = _req.user;

  // if (!_req.files || _req.files.length === 0)  {
  //   errorResponse(res, 400, "No files uploaded. Please upload product images.");
  // return;
  // }

  const body = _req.body;

  const request = async () => {
    const urls = await uploadToR2(_req, res);

    const existingProduct = await Product.findOne({
      $or: [
        {
          name: body.name,
          reference_id: body.reference_id,
        },
      ],
    });

    if (existingProduct) {
      return errorResponse(
        res,
        400,
        "Product with this name or Reference already exists, Edit instead",
        {
          message: "Product with this name already exists",
          existingProduct,
        }
      );
    }
    const product = await Product.create({
      ..._req.body,
      product_images: urls,
      created_by: _req.user?._id,
      is_active: true,
    });

    const log = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(_req.user?._id),
      action: "ADD_PRODUCT",
      sender: new Types.ObjectId(_req.user?._id),
      receiver: product.id,
      description: `New product added: ${product.name}`,
      metadata: {
        product_id: product._id,
        user_id: _req.user?._id,
      },
    });
    await User.findByIdAndUpdate(user?._id, {
      $push: { logs: log.id },
    });
    await Product.findByIdAndUpdate(user?._id, {
      $push: { logs: log.id },
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
export const getSingleProducts = async (_req: AuthRequest, res: Response) => {
  const id = _req.params.id;
  await checkIfDocumentExistsById(id, res, Product);
  const request = async () => {
    return await Product.findById(id);
  };
  customReqResHandler(res, request, undefined, {
    successMessage: "Product Fetched Successfully",
    statusCode: 200,
  });
};

export const updateProduct = async (req: AuthRequest, res: Response) => {};
