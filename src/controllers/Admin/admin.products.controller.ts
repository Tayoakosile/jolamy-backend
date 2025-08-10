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
import { AuthRequest } from "../../types/type";

export const addNewProducts = (_req: AuthRequest, res: Response) => {
  const user = _req.user;

  // if (!_req.files || _req.files.length === 0)  {
  //   errorResponse(res, 400, "No files uploaded. Please upload product images.");
  // return;
  // }

  const body = _req.body;

  const request = async () => {
    const existingProduct = await Product.findOne({
      $or: [
        {
          name: body.name,
          reference_id: body.reference_id,
        },
      ],
    });

    if (existingProduct) {
      errorResponse(
        res,
        400,
        "Product with this name or Reference already exists, Edit instead",
        {
          message: "Product with this name already exists",
          existingProduct,
        }
      );
      return;
    }
    const product = await Product.create({
      ..._req.body,
      // product_images: urls,
      created_by: _req.user?._id,
      is_active: true,
    });

    const log = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(_req.user?.user_id),
      action: "ADD_PRODUCT",
      sender: new Types.ObjectId(_req.user?.user_id),
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
  await checkIfDocumentExistsById(id, "product_id", res, Product);
  const request = async () => {
    const product = await Product.findOne({ product_id: id, is_active: true });

    const logs = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(_req.user?._id),
      action: "GET_PRODUCT",
      sender: new Types.ObjectId(_req.user?._id),
      receiver: new Types.ObjectId(id),
      description: `Product fetched: ${id}`,
      metadata: {
        product_id: id,
        user_id: _req.user?._id,
      },
    });
    await User.findByIdAndUpdate(_req.user?._id, {
      $push: { logs: logs.id },
    });

    return product;
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Product Fetched Successfully",
    statusCode: 200,
  });
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  await checkIfDocumentExistsById(id, "product_id", res, Product);
  const body = req.body;

  const request = async () => {
    const log = await logActivity({
      req,
      user_id: new Types.ObjectId(req.user?._id),
      action: "UPDATE_PRODUCT",
      sender: new Types.ObjectId(req.user?._id),
      receiver: new Types.ObjectId(id),
      description: `Product updated: ${body.name}`,
      metadata: {
        product_id: id,
        user_id: req.user?._id,
      },
    });
    await Product.findByIdAndUpdate(
      id,
      {
        ...body,
        logs: {
          $push: log.id,
        },
      },
      { new: true }
    );
    await User.findByIdAndUpdate(req.user?._id, {
      $push: { logs: log.id },
    });
    return;
  };
  customReqResHandler(res, request, undefined, {
    successMessage: "Product updated successfully",
    statusCode: 200,
  });
};

export const archiveProduct = async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  await checkIfDocumentExistsById(id,'product_id', res, Product);
  const request = async () => {
    const log = await logActivity({
      req,
      user_id: new Types.ObjectId(req.user?._id),
      action: "ARCHIVE_PRODUCT",
      sender: new Types.ObjectId(req.user?._id),
      receiver: new Types.ObjectId(id),
      description: `Product archived: ${id}`,
      metadata: {
        product_id: id,
        user_id: req.user?._id,
      },
    });
    await User.findByIdAndUpdate(req.user?._id, {
      $push: { logs: log.id },
    });
    return await Product.findByIdAndUpdate(
      id,
      { is_active: false, is_archived: true, logs: { $push: log.id } },
      { new: true }
    );
  };
  customReqResHandler(res, request, undefined, {
    successMessage: "Product archived successfully",
    statusCode: 200,
  });
};
