import { Response } from "express";
import { Types } from "mongoose";
import Order from "../models/Order";

import { IProduct, Product } from "../models/Product";
import Transaction from "../models/Transaction";
import User from "../models/User";
import { IOrder } from "../types/order.type";
import { AuthRequest } from "../types/type";
import { logActivity } from "../utils/activityLog";
import { errorResponse, successResponse } from "../utils/response";
import { getTrend } from "../utils/trend.util";
import {
  checkIfDocumentExistsById,
  customReqResHandler,
  generateRandom,
} from "../utils/util";

export const getAllOrders = (_req: AuthRequest, res: Response) => {
  const user = _req.user;
  const worker = _req.worker;

  const request = async () => {
    if (user?.user_role === "admin") {
      const allOrders = await Order.find({});

      const allOrdersStat = await getTrend(Order, {
        period: "week",
      });
      const completedOrders = await getTrend(Order, {
        period: "week",
        filter: {
          status: "completed",
        },
      });
      const pendingOrders = await getTrend(Order, {
        period: "week",
        filter: {
          status: "pending",
        },
      });
      const processingOrders = await getTrend(Order, {
        period: "week",
        filter: {
          status: "processing",
        },
      });
      return {
        stats: [
          {
            title: "All Orders",
            ...allOrdersStat,
          },
          {
            title: "Pending Orders",
            ...pendingOrders,
          },
          {
            title: "Processing Orders",
            ...processingOrders,
          },
          {
            title: "Completed Orders",
            ...completedOrders,
          },
        ],
        orders: allOrders,
      };
    }

    if (worker?.worker_id) {
      const allOrders = await Order.find({
        "assigned_to.office": worker?.office,
        payment_status: "paid",
      });

      return allOrders;
    }
    return await Order.find({ user_id: user?._id });
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Orders retrieved successfully",
    errorMessage: "Error retrieving orders",
    statusCode: 200,
  });
};
export const getSingleOrder = async (_req: AuthRequest, res: Response) => {
  const order = _req?.order;

  const orderDetails = await Order.findById(order && order._id)
    .populate("products")
    .populate("logs")
    .populate({
      path: "assigned_to.office",
      model: "Office",
      select: "name address workers",
    })
    .populate("transaction_id")
    .populate("products")
    .populate({
      path: "user_id",
      select: "first_name user_id last_name email phone_number user_role",
    });

  successResponse(res, 200, "Order retrieved successfully", {
    order: orderDetails,
  });

  // }
};

export const createNewOrder = (_req: AuthRequest, res: Response) => {
  const user = _req.user;
  const id = user?._id;
  const body = _req.body;
  const product_items = body.products;

  const request = async () => {
    const getProductPricing = async (productFromPostAPi: IProduct) => {
      const productResFromDb = productFromPostAPi?.variants
        ? await Product.findOne({
            _id: productFromPostAPi.id,
            "variants._id": {
              $in: productFromPostAPi?.variants?.map(
                (variant: any) => variant.id
              ),
            },
          }).select(
            "name category reference_id _id  available_weight is_active is_archived  variants"
          )
        : await Product.findOne({
            _id: productFromPostAPi.id,
          }).select(
            "name category reference_id  available_weight is_active is_archived  variants"
          );

      // if a product is is_active is false or is_archived is true, return error
      if (
        !productResFromDb ||
        !productResFromDb?.is_active ||
        productResFromDb?.is_archived
      ) {
        errorResponse(res, 400, "Product not found", {
          message: `Product ${productResFromDb?.name} is not available for order.`,
          product: productResFromDb,
        });
        return;
      }

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
            errorResponse(res, 400, "Minimum order quantity not met", {
              message: `Minimum order quantity for ${matchedVariant?.name} is ${matchedVariant?.distributor_pricing.first_time_min_order_qty} boxes on first order.`,
              product: productResFromDb,
              minimum_order_quantity:
                matchedVariant?.distributor_pricing.first_time_min_order_qty,
              user_requested_quantity: variantFromPostAPi.quantity,
            });
            return;
          }

          if (matchedVariant) {
            // total_boxes_in_stock is null means unlimited stock,
            // so we don't check for it  but if it is less than the requested quantity, return error
            if (
              matchedVariant?.total_boxes_in_stock !== null &&
              matchedVariant?.total_boxes_in_stock < variantFromPostAPi.quantity
            ) {
              errorResponse(res, 400, "Insufficient stock", {
                message: `Insufficient stock for ${matchedVariant?.name}. Available: ${matchedVariant?.total_boxes_in_stock}, Requested: ${variantFromPostAPi.quantity}`,
                product: productResFromDb,
                _id: productResFromDb?._id,
                available_stock: matchedVariant?.total_boxes_in_stock,
                user_requested_quantity: variantFromPostAPi.quantity,
              });
              return;
            }

            // Returns the variant with all properties from the matched database variant, and the quantity and total amount.
            return {
              id: matchedVariant._id,
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
        product_id: productInfo?._id,
        name: productInfo?.name || "Unknown Product",
        variants: theVariant,
        total: theVariant.reduce((sum, item) => sum + item.total_amount, 0),
        total_quantity: theVariant.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
      };
    };
    const Products = await Promise.all(
      product_items.map(async (product: IProduct) => getProductPricing(product))
    );

    if (Products.length === 0 || Products.some((p) => !p)) {
      errorResponse(res, 400, "No valid products found in order", {
        message: "Please check the products you are trying to order.",
      });
      return;
    }

    const order = await Order.create({
      products: Products,
      shipping: {
        recipient_name: `${user?.first_name} ${user?.last_name}`,
        phone: user?.phone_number,
        note_from_user: body.note_from_user || "",
        ...user?.address?.distributors_address,
        delivery_type: "delivery",
        ...body?.shipping,
      },
      role: user?.user_role,
      tracking_number: `JOL-${generateRandom(12)}`,
      total_amount: Products.reduce((sum, item) => sum + item?.total, 0),
      delivery_steps: [
        {
          label: "order_placed",
          date: new Date(),
          updated_by: {
            type: "system",
          },
        },
      ],
      delivery_steps_logs: [
        {
          label: "order_placed",
          date: new Date(),
          updated_by: {
            type: "system",
          },
        },
      ],
      user_id: id,
      total_quantity: Products.reduce(
        (sum, item) => sum + item.total_quantity,
        0
      ),
    });

    const transaction = await Transaction.create({
      user_id: new Types.ObjectId(id),
      user_role: user?.user_role,
      order_id: order._id,
      transaction_type: "debit",
      category: "order_payment",
      description: `Payment for order ${order._id}`,
      total: order.total_amount,
      status: "pending",
      metadata: {
        order_id: order._id,
        user_id: id,
      },
    });
    // if()

    const log = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(id),
      action: "CREATE_ORDER",
      sender: new Types.ObjectId(id),
      receiver: order._id as Types.ObjectId,
      description: `${user?.first_name} ${user?.last_name} created Order created with ID ${order.order_number} and total amount of ${order.total_amount}`,
      metadata: {
        order_id: order._id,
        user_id: id,
        sender: user?.first_name + " " + user?.last_name,
        receiver: user?.first_name + " " + user?.last_name,
      },
    });

    await order.updateOne({
      $push: { logs: log._id },
      transaction_id: transaction._id,
    });
    await transaction.updateOne({
      $push: { logs: log._id },
    });

    await User.findByIdAndUpdate(new Types.ObjectId(user?.id), {
      $push: {
        orders: order._id,
        transaction_history: transaction._id,
        logs: log._id,
      },
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
  const order = await checkIfDocumentExistsById<IOrder>(
    orderID,
    "order_number",
    res,
    Order
  );
  const request = async () => {
    // Log that user filled in extra details of the order.... if it contains address

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
        : body?.admin_notes_to_customer || body?.admin_notes_to_office
        ? ` Admin ${user?.first_name} ${
            order?.admin_notes_to_customer || order?.admin_notes_to_customer
              ? `updated  ${
                  body?.admin_notes_to_customer ? "office" : "customer"
                } order notes`
              : `added  ${
                  body?.admin_notes_to_customer ? "office" : "customer"
                } notes to order`
          } `
        : "Order updated with no additional information",
      metadata: {
        previous_notes:
          body?.admin_notes_to_customer || body?.admin_notes_to_office,
        new_notes: body?.admin_notes_to_customer
          ? order?.admin_notes_to_customer
          : order?.admin_notes_to_office,
        order_id: order?._id as Types.ObjectId,
        user_id: user?._id,
        shipping_location: body.shipping_location,
        payment_reference: body.payment_reference,
      },
    });

    const updatedOrder = await Order.findOneAndUpdate(
      { order_number: orderID },
      {
        ...body,
        $push: { logs: log._id },
      }
    );
    await User?.findByIdAndUpdate(user?.id, {
      $push: { logs: log._id },
      last_order_date: new Date(),
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

export const updateOrderStatus = async (_req: AuthRequest, res: Response) => {
  const body = _req.body;
  const user = _req.user;
  if (!body) {
    errorResponse(res, 400, "Body is required", {
      message: `Body is required `,
    });
    return;
  }
  const orderID = _req.params?.id;
  const order = await checkIfDocumentExistsById<IOrder>(
    orderID,
    "order_number",
    res,
    Order
  );

  const request = async () => {
    console.log("order :", order);
  };
};

export const cancelOrder = async (_req: AuthRequest, res: Response) => {};
