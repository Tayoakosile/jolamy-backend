import { Request, Response } from "express";
import { logActivity } from "../utils/activityLog";
import { checkIfDocumentExistsById, customReqResHandler } from "../utils/util";

import { Types } from "mongoose";
import { Cart, ICart } from "../models/Cart";
import { Product } from "../models/Product";
import User from "../models/User";
import { AuthRequest } from "../types/type";
import { errorResponse } from "../utils/response";

export const getSingleProductForNotAdmin = async (
  _req: AuthRequest,
  res: Response
) => {
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

export const addToCart = (req: Request, res: Response) => {
  const _req  = req as AuthRequest;
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


      if(singleCart.modifiedCount === 0) {
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

export const getCart = (_req: AuthRequest, res: Response) => {
  const user_id = (_req as any).user._id;
  const request = async () => {
    const cart = await Cart.findOne({ user: user_id }).populate(
      "items.product"
    );
    if (!cart) {
      errorResponse(res, 404, "Cart not found");
      return;
    }

    const logs = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(_req.user?._id),
      action: "GET_CART",
      sender: new Types.ObjectId(_req.user?._id),
      receiver: cart._id as Types.ObjectId,
      description: `User with ID ${_req.user?.user_id} fetched cart with product`,
      metadata: {
        cart_id: cart._id,
        user_id: _req.user?._id,
      },
    });

    await User.findByIdAndUpdate(_req.user?._id, {
      $push: { logs: logs.id },
    });

    return cart;
  };
  customReqResHandler(res, request, undefined, {
    successMessage: "Cart retrieved successfully",
    statusCode: 200,
  });
};

// async function updateVariantQuantities() {
//   try {
//     for (const variant of variantsToUpdate) {
//       const variantId = mongoose.Types.ObjectId(variant._id);

//       await Cart.updateOne(
//         { "items.variants._id": variantId },
//         {
//           $set: {
//             "items.$[item].variants.$[variant].quantity": variant.quantity,
//           },
//         },
//         {
//           arrayFilters: [
//             { "item.variants._id": variantId },
//             { "variant._id": variantId },
//           ],
//         }
//       );
//     }

//     console.log("Variant quantities updated!");
//   } catch (error) {
//     console.error("Error updating variant quantities:", error);
//   }
// }

// updateVariantQuantities();
