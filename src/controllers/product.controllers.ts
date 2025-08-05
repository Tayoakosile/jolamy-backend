import { Request, Response } from "express";
import CashFlow, { IFinance } from "../models/CashFlow";
import { checkIfDocumentExistsById, customReqResHandler } from "../utils/util";
import Offices from "../models/Admin/Office";
import { logActivity } from "../utils/activityLog";
import { OfficeWorker } from "../models/Admin/OfficeWorker";
import { Types } from "mongoose";
import { errorResponse } from "../utils/response";
import { Product } from "../models/Product";
import { AuthRequest } from "../types/type";
import User from "../models/User";
import { Cart, ICart } from "../models/Cart";

export const getSingleProductForNotAdmin = async (
  _req: AuthRequest,
  res: Response
) => {
  const id = _req.params.id;
  await checkIfDocumentExistsById(id, res, Product);
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

export const addToCart = (_req: AuthRequest, res: Response) => {
  const user_id = (_req as any).user._id;
  const product_id = _req.params.id;
  const request = async () => {
    await checkIfDocumentExistsById(product_id, res, Product);
    const product = await Product.findById(product_id);
    if (!product) {
      errorResponse(res, 404, "Product not found");
      return;
    }

    const existingCart = (await Cart.findOne({
      user: user_id,
    })) as any;

    if (existingCart) {
      const checkIfProductIdExists = Array.from(existingCart.items).find(
        (item: any) => `${item.product}` == `${product_id}`
      );
      // If the product is already in the cart, update the quantity
      const log = await logActivity({
        req: _req,
        user_id: user_id,
        action: "ADD_TO_CART",
        sender: user_id,
        receiver: new Types.ObjectId(product_id),
        description: `User with ID ${user_id} added product with ID ${product_id} to cart`,
        metadata: {
          cart_id: existingCart._id,
          product_id: product_id,
          user_id: user_id,
        },
      });
      if (checkIfProductIdExists) {
        await Cart.findOneAndUpdate(
          {
            _id: existingCart._id,
            "items.product": product_id,
          },
          {
            $set: {
              "items.$.product": product_id,
              "items.$.quantity": _req.body.quantity || 1,
            },
          }
        );
      } else {
        await Cart.findOneAndUpdate(
          { _id: existingCart._id },
          {
            $push: {
              items: {
                product: new Types.ObjectId(product_id),
                quantity: _req.body?.quantity || 1,
              },
            },
          }
        );
      }

      await User.findByIdAndUpdate(user_id, {
        $push: { cart: existingCart._id, logs: log._id },
      });
      return { message: "Product quantity updated in cart successfully" };
    }

    if (existingCart) {
    }

    const cart = (await Cart.create({
      user: user_id,
      items: [
        {
          product: new Types.ObjectId(product_id),
          quantity: _req.body?.quantity || 1,
        },
      ],
    })) as ICart;
    const log = await logActivity({
      req: _req,
      user_id: user_id,
      action: "ADD_TO_CART",
      sender: user_id,
      receiver: new Types.ObjectId(product_id),
      description: `User with ID ${user_id} added product with ID ${product_id} to cart`,
      metadata: {
        cart_id: cart._id,
        product_id: product_id,
        user_id: user_id,
      },
    });
    await cart.updateOne({
      $push: { logs: log._id },
    });
    await User.findByIdAndUpdate(user_id, {
      $push: { cart: cart._id, logs: log._id },
    });

    return { message: "Product added to cart successfully" };
  };
  customReqResHandler(res, request, undefined, {
    successMessage: "Product added to cart successfully",
    errorMessage: "Error adding product to cart",
    statusCode: 200,
  });
};
