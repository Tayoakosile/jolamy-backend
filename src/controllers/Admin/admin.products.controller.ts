import { Request, Response } from "express";
import { Types } from "mongoose";
import { Product } from "../../models/Product";
import User from "../../models/User";
import { AuthRequest } from "../../types/type";
import { logActivity } from "../../utils/activityLog";
import { errorResponse } from "../../utils/response";
import {
  checkIfDocumentExistsById,
  customReqResHandler,
} from "../../utils/util";

export const addNewProducts = async (req: Request, res: Response) => {
  const _req = req as AuthRequest;
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
      user_id: new Types.ObjectId(_req.user?._id),
      action: "ADD_PRODUCT",
      sender: new Types.ObjectId(_req.user?._id),
      receiver: product.id,
      description: `New product added: ${product.name}`,
      metadata: {
        product_id: product.product_id,
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

export const getProducts = (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  const request = async () => {
    const isUserAdmin = _req.user?.is_admin;
    return isUserAdmin
      ? await Product.find({ is_active: true })
      : await Product.find({ is_active: true }).select(
          "-logs -orders -inventory -created_by -is_archived -archived_at -archived_by"
        );
  };
  customReqResHandler(res, request);
};
export const getSingleProducts = async (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  const id = _req.params.id;
  const request = async () => {
    const product = await checkIfDocumentExistsById(
      id,
      "product_id",
      res,
      Product,
      ['orders']
    );

    const logs = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(_req.user?._id),
      action: "GET_PRODUCT",
      sender: new Types.ObjectId(_req.user?._id),
      receiver: product?._id as Types.ObjectId,
      description: `Product fetched: ${id}`,
      metadata: {
        product_id: product?._id,
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

export const updateProduct = async (_req: Request, res: Response) => {
  const req = _req as AuthRequest;
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

export const archiveProduct = async (_req: Request, res: Response) => {
  const req = _req as AuthRequest;
  const id = req.params.id;
  await checkIfDocumentExistsById(id, "product_id", res, Product);
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
