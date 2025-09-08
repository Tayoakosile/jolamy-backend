import { Request, Response } from "express";
import { logActivity } from "../utils/activityLog";
import { checkIfDocumentExistsById, customReqResHandler } from "../utils/util";

import { Types } from "mongoose";
import { Product } from "../models/Product";
import User from "../models/User";
import { AuthRequest } from "../types/type";

export const getSingleProductForNotAdmin = async (
  req: Request,
  res: Response
) => {
  const _req = req as AuthRequest;
  const id = _req.params.id;
  await checkIfDocumentExistsById(id, "product_id", res, Product);
  const request = async () => {
    const product = await Product.findOne({ _id: id });

    const logs = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(_req.user?._id),
      action: "GET_PRODUCT",
      sender: new Types.ObjectId(_req.user?._id),
      receiver: new Types.ObjectId(id),
      description: `User with ID ${_req.user?._id} fetched product with ID ${id}`,
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
