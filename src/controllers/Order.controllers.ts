import { Response } from "express";
import { Types } from "mongoose";
import Order, { IOrder } from "../models/Order";
import { IProduct, Product } from "../models/Product";
import User from "../models/User";
import { AuthRequest, IUser } from "../types/type";
import { logActivity } from "../utils/activityLog";
import { errorResponse } from "../utils/response";
import { updateFinance } from "./finance.controllers";
import {
  checkIfDocumentExistsById,
  customReqResHandler,
  generateRandom,
} from "../utils/util";

export const getAllOrders = (_req: AuthRequest, res: Response) => {
  const id = _req.user?._id;

  const request = async () => {
    return await Order.find({ user_id: id });
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Orders retrieved successfully",
    errorMessage: "Error retrieving orders",
    statusCode: 200,
  });
};
export const getSingleOrder = (_req: AuthRequest, res: Response) => {};
export const createNewOrder = (_req: AuthRequest, res: Response) => {
  const user = _req.user;
  const id = user?._id;
  const body = _req.body;
  const product_items = body.products;

  const request = async () => {
    const getProductPricing = async (productFromPostAPi: IProduct) => {
      const productResFromDb = await Product.findOne({
        _id: productFromPostAPi.id,
        "variants._id": {
          $in: productFromPostAPi?.variants?.map((variant: any) => variant.id),
        },
      }).select(
        "name category reference_id  available_weight is_active is_archived  variants"
      );
      // if a product is is_active is false or is_archived is true, return error
      if (!productResFromDb?.is_active || productResFromDb?.is_archived) {
        return errorResponse(res, 404, "Product not found", {
          message: `Product ${productResFromDb?.name} is not available for order.`,
          product: productResFromDb,
        });
      }

      /**
       * Maps over the variants provided by the POST API, matches each variant with its corresponding
       * variant from the database, and constructs a new variant object containing:
       * - All properties from the matched database variant (converted to a plain object)
       * - The quantity specified in the POST API variant (defaulting to 0 if not provided)
       * - The total price, calculated as the matched variant's distributor price per box multiplied by the quantity
       *
       * @param productFromPostAPi - The product object received from the POST API, expected to have a `variants` array.
       * @param productResFromDb - The product object retrieved from the database, expected to have a `variants` array.
       * @returns An array of variant objects with updated quantity and total price, or `undefined` for unmatched variants.
       */
      /**
       * Maps over the variants provided in the product data from the POST API, matches each with the corresponding variant from the database,
       * and performs the following:
       * - Checks if the user is placing their first order and if the requested quantity meets the minimum order quantity for first-time orders.
       *   If not, returns an error response.
       * - For matched variants, returns an object containing the variant's details, the requested quantity, and the total price for that quantity.
       * - If no matching variant is found, returns `undefined` for that entry.
       *
       * @param productFromPostAPi - The product object received from the POST API, containing an array of variants with requested quantities.
       * @param productResFromDb - The product object retrieved from the database, containing an array of variants with pricing and minimum order information.
       * @param user - The user object, used to determine if this is the user's first order.
       * @param res - The Express response object, used to send error responses if minimum order quantity is not met.
       * @returns An array where each entry corresponds to a variant from the POST API:
       *   - If the minimum order quantity is not met, an error response is sent and the entry is `undefined`.
       *   - If a matching variant is found, returns an object with variant details, requested quantity, and total price.
       *   - If no matching variant is found, returns `undefined`.
       */
      const theVariant = (productFromPostAPi?.variants || [])?.map(
        (variantFromPostAPi: any) => {
          const matchedVariant = productResFromDb?.variants.find(
            (v: any) => v.id === variantFromPostAPi.id
          );

          if (
            !user?.last_order_date &&
            variantFromPostAPi.quantity <
              (matchedVariant?.distributor_pricing?.first_time_min_order_qty ||
                0)
          ) {
            return errorResponse(res, 401, "Minimum order quantity not met", {
              message: `Minimum order quantity for ${matchedVariant?.name} is ${matchedVariant?.distributor_pricing.first_time_min_order_qty} boxes on first order.`,
              product: productResFromDb,
              minimum_order_quantity:
                matchedVariant?.distributor_pricing.first_time_min_order_qty,
              user_requested_quantity: variantFromPostAPi.quantity,
            });
          }

          if (matchedVariant) {
            // total_boxes_in_stock is null means unlimited stock,
            // so we don't check for it  but if it is less than the requested quantity, return error
            if (
              matchedVariant?.total_boxes_in_stock !== null &&
              matchedVariant?.total_boxes_in_stock < variantFromPostAPi.quantity
            ) {
              return errorResponse(res, 401, "Insufficient stock", {
                message: `Insufficient stock for ${matchedVariant?.name}. Available: ${matchedVariant?.total_boxes_in_stock}, Requested: ${variantFromPostAPi.quantity}`,
                product: productResFromDb,
                available_stock: matchedVariant?.total_boxes_in_stock,
                user_requested_quantity: variantFromPostAPi.quantity,
              });
            }

            // Returns the variant with all properties from the matched database variant, and the quantity and total amount.
            return {
              name: matchedVariant.name,
              total_boxes_in_stock: matchedVariant.total_boxes_in_stock,
              amount_per_box: matchedVariant.distributor_pricing.price_per_box,
              quantity: variantFromPostAPi?.quantity || 0,
              total_amount:
                (matchedVariant?.distributor_pricing?.price_per_box ?? 0) *
                (variantFromPostAPi?.quantity || 0),
            };
          }
          return variantFromPostAPi;
        }
      );

      const productInfo = productResFromDb ? productResFromDb.toObject() : null;

      return {
        name: productInfo?.name || "Unknown Product",
        variants: theVariant,
        total: theVariant.reduce((sum, item) => sum + item.total_amount, 0),
      };
    };

    const Products = await Promise.all(
      product_items.map(async (product: IProduct) => getProductPricing(product))
    );

    const order = await Order.create({
      products: Products,
      internal_notes: body.internal_notes || "",
      role: user?.user_role,
      tracking_number: `JOL-${generateRandom(12)}`,
      total_amount: Products.reduce((sum, item) => sum + item.total, 0),
      user_id: id,
    });

    const log = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(id),
      action: "CREATE_ORDER",
      sender: new Types.ObjectId(id),
      receiver: order._id,
      description: `Order created with ID ${order._id}`,
      metadata: {
        order_id: order._id,
        user_id: id,
      },
    });
    await order.updateOne({
      $push: { logs: log._id },
    });
    await User.findByIdAndUpdate(new Types.ObjectId(user?.id), {
      $push: { orders: order._id },
      last_order_date: new Date(),
    });

    return order;
  };

  customReqResHandler(
    res,
    request,
    undefined,
    {
      successMessage: "Order created successfully",
      errorMessage: "Error creating order",
      statusCode: 201,
    },
    {
      shouldSendMail: true,
      mailTo: user?.email,
      title: "Order Confirmation",
      message: `Your order with ID ${generateRandom(
        12
      )} has been successfully created. Please proceed to fill in your delivery and payment details.`,
    }
  );
};
export const updateOrder = async (_req: AuthRequest, res: Response) => {
  const body = _req.body;
  const user = _req.user;
  const orderID = _req.params?.id;
  const order = await checkIfDocumentExistsById<IOrder>(orderID, res, Order);
  const request = async () => {
    const checkIfOrderBelongsToUser = user?.orders.find(
      (order: any) => order._id.toString() === orderID
    );

    // If payment made already or it is delivered, do not allow update
    if (
      order?.payment_status === "paid" ||
      order?.delivery_status === "delivered"
    ) {
      return errorResponse(res, 400, "Order cannot be updated", {
        message: "Order has already been paid or delivered",
      });
    }
    if (!checkIfOrderBelongsToUser)
      return errorResponse(res, 404, "Order not found", {
        message: "Order not found or does not belong to the user",
      });
    // Log that user filled in extra details of the order.. if it contains address

    const log = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(user?._id),
      action: "UPDATE_ORDER",
      sender: new Types.ObjectId(user?._id),
      receiver: order?._id as Types.ObjectId,
      description: body?.shipping_location
        ? `Order updated with shipping location`
        : body?.payment_reference
        ? "Order updated with payment information"
        : "Order updated",
      metadata: {
        order_id: order?._id as Types.ObjectId,
        user_id: user?._id,
        shipping_location: body.shipping_location,
        payment_reference: body.payment_reference,
      },
    });

    const updatedOrder = await Order.findByIdAndUpdate(orderID, {
      ...body,
      $push: { logs: log._id },
    });
    await User?.findByIdAndUpdate(user?.id, {
      $push: { logs: log._id },
    });
    return updatedOrder;
  };
  customReqResHandler(
    res,
    request,
    undefined,
    {
      successMessage: "Order updated successfully",
      errorMessage: "Error updating order",
      statusCode: 200,
    },
    {
      shouldSendMail: true,
      mailTo: _req.user?.email,
      title: "Order Update",
      message: `Your order with ID ${_req.params?.id} has been updated successfully.`,
    }
  );
};
