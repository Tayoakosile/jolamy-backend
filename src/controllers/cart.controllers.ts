import { Request, Response } from "express";
import { logActivity } from "../utils/activityLog";
import { checkIfDocumentExistsById, customReqResHandler } from "../utils/util";

import { Types } from "mongoose";
import { Cart, ICart } from "../models/Cart";
import { Product } from "../models/Product";
import User from "../models/User";
import { AuthRequest } from "../types/type";
import { errorResponse } from "../utils/response";

export const addToCart = (_req: AuthRequest, res: Response) => {
  const user_id = (_req as any).user._id;
  const product_id = _req.body?.product_id;
  const variants = _req.body?.variants || [];

  if (!product_id) {
    errorResponse(res, 400, "Product ID is required");
    return;
  }
  const request = async () => {

    const product = await checkIfDocumentExistsById(
      product_id,
      "product_id",
      res,
      Product,
      undefined,
      400
    );

    if (!product) {
      return;
    }

    const existingCart = (await Cart.findOne({
      user: user_id,
    })) as any;
    console.log('existingCart :', existingCart);



    if (!existingCart) {
      const cart = (await Cart.create({
        user: user_id,
        items: [
          {
            product: product._id,
            variants: [..._req.body?.variants],
          },
        ],
      })) as ICart;

      const log = await logActivity({
        req: _req,
        user_id: user_id,
        action: "ADD_TO_CART",
        sender: user_id,
        receiver: product?._id as Types.ObjectId,
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
    }

    for (const variant of variants) {
      const variantId = variant._id;

      const singleCart = await Cart.updateOne(
        { "items.variants._id": variantId },
        {
          $set: {
            "items.$[i].variants.$[j].quantity": variant.quantity,
          },
        },
        {
          arrayFilters: [
            { "i.variants._id": variantId },

            { "j._id": variantId },
          ],
        }
      );

      if (singleCart.modifiedCount === 0) {
        await existingCart.updateOne({
          $push: {
            items: {
              product: product._id,
              variants: [{ ...variant }],
            },
          },
        });
      }
    }
    return;

    const log = await logActivity({
      req: _req,
      user_id: user_id,
      action: "ADD_TO_CART",
      sender: user_id,
      receiver: product?._id as Types.ObjectId,
      description: `User with ID ${user_id} added product with ID ${product_id} to cart`,
      metadata: {
        cart_id: existingCart._id,
        product_id: product_id,
        user_id: user_id,
      },
    });

    await User.findByIdAndUpdate(user_id, {
      $push: { cart: existingCart._id, logs: log._id },
    });
    return { message: "Product quantity updated in cart successfully" };
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Product added to cart successfully",
    errorMessage: "Error adding product to cart",
    statusCode: 200,
  });
};

export const getCarts = (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  const user_id = (_req as AuthRequest)?.user?._id;
  const request = async () => {
    const cart = (await Cart.findOne({ user: user_id }).populate({
      path: "items.product",
      select: "-created_by  -orders -is_archived -logs -inventory",
    })) as ICart;

    const updatedCart = cart?.toObject()?.items.map((item: any) => {
      return item.variants.map((originalVariant: any) => {
        const variant = item.product.variants.find(
          (v: any) => v._id.toString() === originalVariant._id.toString()
        );
        const { variants, ...rest } = item.product;

        if (variant) {
          return {
            ...variant,
            variant_name: originalVariant.name || "",
            ...rest,
            variant_id: originalVariant?._id,
            original_product_id: item.product?._id,
            quantity: originalVariant?.quantity || 0,
            total_price:
              originalVariant?.quantity *
                variant?.distributor_pricing?.price_per_box || 0,
          };
        }
      });
    });

    const logs = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(_req.user?._id),
      action: "GET_CART",
      sender: new Types.ObjectId(_req.user?._id),
      receiver: _req.user?._id,
      description: `User with ID ${_req.user?.user_id} fetched cart with product`,
      metadata: {
        cart_id: cart?._id || "",
        user_id: _req.user?._id,
      },
    });

    await User.findByIdAndUpdate(_req.user?._id, {
      $push: { logs: logs.id },
    });

    return { cart, checkout: updatedCart };
  };
  customReqResHandler(res, request, undefined, {
    successMessage: "Cart retrieved successfully",
    statusCode: 200,
  });
};

export const deleteCart = async (_req: Request, res: Response) => {
  const req = _req as AuthRequest;

  const id = req.params?.id;
  console.log(" :", req.params, req.body, "_req.body");
  console.log("req.user?._id :", req.user?._id);

  // return;
  //
  const request = async () => {
    const user_id = req.user?._id as string;
    // const cart = (await Cart.findOneAndDelete({ user: user_id })) as ICart;
    const cart = await Cart.findOneAndUpdate(
      { user: user_id, "items.product": req.body.product_id },
      { $pull: { items: { "variants._id": { _id: req.body?.variant_id } } } },
      { new: true }
    );
    const findCart = await Cart.findOne({
      user: user_id,
      "items.product": req.body.product_id,
    });
    console.log("findCart :", findCart);

    console.log("cart :", cart);
    return;
    // await User.findByIdAndUpdate(user_id, { $pull: { cart: cart?._id } });

    await logActivity({
      req,
      user_id,
      action: "DELETE_CART",
      sender: user_id,
      receiver: cart?._id as string,
      description: `User with name ${req.user?.first_name} ${req.user?.last_name} deleted cart with ID ${cart?._id}`,
      metadata: {
        cart_id: cart?._id,
        user_id,
      },
    });

    res.status(200).json({ message: "Cart deleted successfully" });
  };
  customReqResHandler(res, request, undefined, {
    successMessage: "Cart deleted successfully",
    errorMessage: "Error deleting cart",
    statusCode: 200,
  });
};
