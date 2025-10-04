import { Request, Response } from "express";
import { Types } from "mongoose";
import Order from "../models/Order";

import dayjs from "dayjs";
import Offices from "../models/Admin/Office";
import OfficeWorker from "../models/Admin/OfficeWorker";
import { IProduct, Product } from "../models/Product";
import SalesAgentOrder from "../models/SalesAgentOrders";
import StockLog from "../models/StockLog";
import Transaction from "../models/Transaction";
import User from "../models/User";
import { IOrder, ProductVariant } from "../types/order.type";
import { AuthRequest } from "../types/type";
import { logActivity } from "../utils/activityLog";
import { errorResponse, successResponse } from "../utils/response";
import { getTrend } from "../utils/trend.util";
import {
  brand_colors,
  customReqResHandler,
  deleteCartComp,
  generateRandom,
} from "../utils/util";
import { Cart } from "../models/Cart";
import Notification from "../models/Notification";

export const getAllOrders = (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  const user = _req.user;
  const search = _req.query.search as string;
  const worker = _req.worker;
  const param = _req.query.type;
  const searchFields = [
    "order_number",
    "status",
    "payment_status",
    "priority_level",
    "delivery_status",
    "tracking_number",
  ];
  let query: any = {};
  if (search?.length >= 1) {
    query.$or = searchFields.map((field) => ({
      [field]: { $regex: search?.toLocaleLowerCase() },
    }));
  }

  const request = async () => {
    if (user?.user_role === "admin") {
      const allOrders = await Order.find({})
        .sort({ updated_at: -1 })
        .populate("products.product_id");

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

    if (typeof param === "string" && param.includes("sales_agent")) {
      const salesOrders = await SalesAgentOrder.find({
        "assigned_to.distributor": user?._id,
      })
        .sort({ updated_at: -1 })
        .populate("products.product_id");
      return { orders: salesOrders };
    }
    if (user?.is_sales_agent) {
      const salesOrders = await SalesAgentOrder.find({
        user_id: user?._id,
      })
        .sort({ updated_at: -1 })
        .populate("products.product_id");
      return { orders: salesOrders };
    }

    return {
      orders: await Order.find({ user_id: user?._id, ...query })
        .sort({ updated_at: -1 })
        .populate("products.product_id"),
    };
  };

  customReqResHandler(res, request, undefined, {
    successMessage: "Orders retrieved successfully",
    errorMessage: "Error retrieving orders",
    statusCode: 200,
  });
};

export const getSingleOrder = async (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  const order = _req?.order;

  let orderDetails =
    !_req?.user?.is_sales_agent && !order?.order_number?.includes("SAO")
      ? await Order.findById(order && order._id)
          .populate("products")
          .populate("logs")
          .populate({
            path: "assigned_to.office",
            model: "Office",
            select: "name address workers",
          })
          .populate("transaction_id")
          .populate("products.product_id")
          .populate({
            path: "user_id",
            select: "first_name user_id last_name email phone_number user_role",
          })
      : await SalesAgentOrder.findById(order && order._id)
          .populate("products")
          .populate("products.product_id")
          .populate("logs")
          .populate({
            path: "pickup.distributor_id",
            select: "first_name user_id last_name email phone_number user_role",
          })
          .populate("transaction_id")
          .populate({
            path: "user_id",
            select: "first_name user_id last_name email phone_number user_role",
          });

  // if (orderDetails?.order_number?.includes("SAO")) {
  //   const otpRecord = await Otp.findOne({
  //     email: orderDetails.user_id?.email,
  //     type: "order_collection",
  //     // expires_at: { $gt: new Date() },
  //   });
  //   if (!otpRecord?.code) return;
  //   getIO()
  //     .to(`${orderDetails?.assigned_to?.distributor}`)
  //     .emit("start_order_collection_process", {
  //       type: "otp",
  //       order_id: order?._id,
  //     });

  //   getIO()
  //     .to(`${orderDetails?.user_id?._id}`)
  //     .emit("start_order_collection_process", {
  //       type: "otp",
  //       otp: otpRecord?.code,
  //       order_id: order?._id,
  //     });
  // }

  const isAtLeast5MinuteAhead = dayjs().isAfter(
    dayjs(orderDetails?.collection_otp_expiry)
  );

  if (isAtLeast5MinuteAhead) {
    await SalesAgentOrder.findByIdAndUpdate(order?._id, {
      collection_otp: "",
      collection_otp_expiry: null,
    });
  }

  successResponse(res, 200, "Order retrieved successfully", {
    order: _req?.user?.is_sales_agent
      ? {
          ...orderDetails?.toObject(),
          is_cancelled: order?.status?.includes("cancel"),

          is_delivered: order?.delivery_steps?.some((step) =>
            step.label.includes("delivered")
          ),
        }
      : {
          ...orderDetails?.toObject(),
          is_cancelled: order?.status?.includes("cancel"),
          is_delivered: order?.delivery_steps?.some((step) =>
            step.label.includes("delivered")
          ),
          collection_otp: "",
          collection_otp_expiry: "",
          collection_otp_length: orderDetails?.collection_otp?.length,
        },
  });

  // }
};

export const createNewOrder = (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  const user = _req.user;
  const id = user?._id;
  const body = _req.body;
  const product_items = body.products;
  const quantity_ordered = body.quantity;

  const request = async () => {
    const getProductPricing = async (
      productFromPostAPi: IProduct,
      quantity_ordered: number
    ) => {
      // const fieldsToSelect =
      //   "name category reference_id _id distributor_price_per_box sales_agent_price_per_box available_weight is_active is_archived  variants";
      const productResFromDb =
        productFromPostAPi?.variants?.length >= 1
          ? await Product.findOne({
              _id: productFromPostAPi.id,
              "variants._id": {
                $in: productFromPostAPi?.variants?.map(
                  (variant: any) => variant.id
                ),
              },
            })
          : // .select(fieldsToSelect)
            await Product.findOne({
              _id: productFromPostAPi.id,
            });
      // .select(fieldsToSelect);

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

      const productInfo = productResFromDb.toObject();
      const isProductVariantEmpty = productInfo?.variants.length === 0;
      return {
        product_id: productInfo?._id,
        name: productInfo?.name || "Unknown Product",
        quantity: quantity_ordered || 0,
        price: productInfo.distributor_price_per_box,
        variants: theVariant,
        total_amount: isProductVariantEmpty
          ? productFromPostAPi?.quantity &&
            productFromPostAPi?.quantity * productInfo.distributor_price_per_box
          : theVariant.reduce((sum, item) => sum + item.total_amount, 0),
        total_quantity: isProductVariantEmpty
          ? productFromPostAPi?.quantity
          : theVariant.reduce((sum, item) => sum + item.quantity, 0),
      };
    };
    const Products = await Promise.all(
      product_items.map(async (product: IProduct) =>
        getProductPricing(product, quantity_ordered)
      )
    );

    if (Products.length === 0 || Products.some((p) => !p)) {
      errorResponse(res, 400, "No valid products found in order", {
        message: "Please check the products you are trying to order.",
      });
      return;
    }

    // console.log("Products :", Products);

    // return;

    const order = user?.is_distributor
      ? await Order.create({
          products: Products,
          shipping: user?.address?.distributors_address?.address
            ? {
                recipient_name: `${user?.first_name} ${user?.last_name}`,
                phone: user?.phone_number,
                note_from_user: body.note_from_user || "",
                ...user?.address?.distributors_address,
                delivery_type: "delivery",
                ...body?.shipping,
              }
            : {
                recipient_name: `${user?.first_name} ${user?.last_name}`,
                phone: user?.phone_number,
                note_from_user: body.note_from_user || "",
                ...user?.address?.business_address,
                delivery_type: "delivery",
                ...body?.shipping,
              },
          role: user?.user_role,
          tracking_number: `JOL-${generateRandom(12)}`,
          total_amount: Products.reduce(
            (sum, item) => sum + item?.total_amount,
            0
          ),
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
        })
      : await SalesAgentOrder.create({
          products: Products,
          role: user?.user_role,
          tracking_number: `JOL-${generateRandom(12)}`,
          total_amount: Products.reduce(
            (sum, item) => sum + item?.total_amount,
            0
          ),
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
      description: `Payment for order ${order.order_number} by ${user?.first_name} ${user?.last_name}, total amount ${order.total_amount}`,
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
    product_items.map(
      async (product: IProduct) =>
        await Product.findByIdAndUpdate(product.id, {
          $push: {
            orders: order._id,
          },
        })
    );
    const notification = await Notification.create({
      user: user?._id,
      type: "order",
      title: "Order Created",
      link: `/orders/${order.order_number}`,
      message: `Your order with ID <span style="color:${brand_colors?.brand[500]}; font-weight:700;">#${order.order_number}</span> has been created successfully.`,
      metadata: {
        order_id: order._id,
        user_id: user?._id,
        total_amount: order.total_amount,
      },
    });
    await User.findByIdAndUpdate(new Types.ObjectId(user?.id), {
      $push: {
        orders: order._id,
        transaction_history: transaction._id,
        logs: log._id,
        notifications: notification._id,
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
export const updateOrder = async (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  const body = _req.body;
  const user = _req.user;

  const orderID = _req.params?.id;
  const order = _req.order;
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

    const updatedOrder = user?.is_distributor
      ? await Order.findOneAndUpdate(
          { order_number: orderID },
          {
            ...body,
            $push: { logs: log._id },
          }
        )
      : await SalesAgentOrder.findOneAndUpdate(
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

export const updateOrderStatus = async (req: Request, res: Response) => {
  const _req = req as AuthRequest;
  const body = _req.body;
  console.log("body?.status :", body?.status);
  const should_cancel_order = body?.should_cancel_order;

  // return;
  const order = _req.order;
  const user = _req.user;
  const delivery_status = body?.delivery_status || order?.delivery_status;
  const worker = _req.worker;

  const order_status = should_cancel_order
    ? "cancelled"
    : body?.status
    ? body?.status
    : delivery_status.includes("delivered")
    ? "delivered"
    : "processing";
  console.log("order_status :", order_status);

  // return;
  if (!body) {
    errorResponse(res, 400, "Body is required", {
      message: `Body is required `,
    });
    return;
  }

  const isOrderStatusAlreadyIn = order?.delivery_steps.find(
    (step) => step.label === delivery_status
  );

  const isOrderDelivered =
    order?.delivery_steps[order?.delivery_steps?.length - 1].label?.includes(
      "order_delivered"
    );

  if (isOrderDelivered && !user?.is_admin) {
    successResponse(res, 400, "Order already delivered", {
      message: `Order already delivered`,
    });
    return;
  }
  const delivery_step = {
    label: delivery_status,
    description: body.description || "",
    date: new Date(),
    updated_by: {
      type: worker?.worker_id ? "worker" : "admin",
      name: worker
        ? worker?.first_name + " " + worker?.last_name
        : user?.first_name + " " + user?.last_name,
      role: worker ? "worker" : user?.user_role,
      id: worker?.worker_id || user?._id,
      office_id: worker?.office_id || null,
      office: worker?.office_id || null,
    },
  };

  if (order?.role == "sales_agent") {
    const log = await logActivity({
      req: _req,
      user_id: worker?.id || user?._id,
      action: "UPDATE_ORDER_STATUS",
      sender: worker?.id || user?._id,
      receiver: order?._id as Types.ObjectId,
      description: `Order status updated to ${delivery_status} by ${
        worker?.id ? "worker" : "admin"
      } ${worker?.first_name || user?.first_name} ${
        worker?.last_name || user?.last_name
      }`,
      metadata: {
        order_id: order?._id as Types.ObjectId,
        user_id: worker?.id || user?._id,
        new_status: delivery_status,
        updated_by: worker?.id ? "worker" : "admin",
        sender: user?.first_name + " " + user?.last_name,
        receiver: user?.first_name + " " + user?.last_name,
      },
    });
    const salesAgentOrder = await SalesAgentOrder.findById(order?._id);
    if (!salesAgentOrder) {
      errorResponse(res, 404, "Order not found", {
        message: `Order not found `,
      });
      return;
    }
    await User.findByIdAndUpdate(salesAgentOrder.user_id, {
      $push: {
        logs: log._id,
      },
    });
    if (isOrderStatusAlreadyIn) {
      await SalesAgentOrder.findByIdAndUpdate(order?._id, {
        estimated_delivery_date: body.estimated_delivery_date,
        delivery_status: body.delivery_status,
        status: body?.status
          ? body?.status
          : body?.delivery_status === "delivered"
          ? "delivered"
          : "processing",
        $push: { logs: log._id },
      });
    } else {
      await SalesAgentOrder.findByIdAndUpdate(order?._id, {
        estimated_delivery_date: body.estimated_delivery_date,
        delivery_status: delivery_status,
        status: body?.status
          ? body?.status
          : delivery_status.includes("delivered")
          ? "delivered"
          : "processing",

        $push: {
          logs: log._id,
          delivery_steps: delivery_step,
          delivery_steps_logs: delivery_step,
        },
      });
    }
    successResponse(res, 200, "Order status updated successfully", {
      message: " Order status updated successfully",
    });

    return;
  }

  // TODO: update Logs

  const log = await logActivity({
    req: _req,
    user_id: worker?.id || user?._id,
    action: "UPDATE_ORDER_STATUS",
    sender: worker?.id || user?._id,
    receiver: order?._id as Types.ObjectId,
    description: `Order status updated to ${delivery_status} by ${
      worker?.id ? "worker" : "admin"
    } ${worker?.first_name || user?.first_name} ${
      worker?.last_name || user?.last_name
    }`,
    metadata: {
      order_id: order?._id as Types.ObjectId,
      user_id: worker?.id || user?._id,
      new_status: delivery_status,
      updated_by: worker?.id ? "worker" : "admin",
      sender: user?.first_name + " " + user?.last_name,
      receiver: user?.first_name + " " + user?.last_name,
    },
  });

  if (should_cancel_order && order?.payment_status !== "paid" && order) {
    const cancel_log = await logActivity({
      req: _req,
      user_id: worker?.id || user?._id,
      action: "CANCEL_ORDER",
      sender: worker?.id || user?._id,
      receiver: order?._id as Types.ObjectId,
      description: `Order cancelled by ${worker?.id ? "worker" : "admin"} ${
        worker?.first_name || user?.first_name
      } ${worker?.last_name || user?.last_name}`,
      metadata: {
        order_id: order?._id as Types.ObjectId,
        user_id: worker?.id || user?._id,
        cancelled_by: worker?.id ? "worker" : "admin",
        sender: user?.first_name + " " + user?.last_name,
        receiver: user?.first_name + " " + user?.last_name,
      },
    });
    const order_details = await Order.findByIdAndUpdate(order?._id, {
      status: "cancelled",
      delivery_status: "order_cancelled",
      payment_status: "cancelled",
      $push: {
        logs: log._id,
        delivery_steps: {
          label: "order_cancelled",
          date: new Date(),
          updated_by: {
            type: "user",
            name: user?.first_name + " " + user?.last_name,
            role: user?.user_role,
          },
        },
        delivery_steps_logs: {
          label: "order_cancelled",
          date: new Date(),
          updated_by: {
            type: "user",
            name: user?.first_name + " " + user?.last_name,
            role: user?.user_role,
          },
        },
      },
    });
    console.log(" :");

    successResponse(res, 200, "Order status updated successfully", {
      message: " Order status updated successfully",
    });

    return;
  }

  if (isOrderStatusAlreadyIn) {
    await Order.findByIdAndUpdate(order?._id, {
      estimated_delivery_date: body.estimated_delivery_date,
      delivery_status: body.delivery_status,
      status: body?.status
        ? body?.status
        : body?.delivery_status === "delivered"
        ? "delivered"
        : "processing",
    });
    successResponse(res, 200, "Order status updated successfully", {
      message: " Order status updated successfully",
    });
  } else {
    if (user?.is_admin && delivery_status?.includes("order_delivered")) {
      if (!order) return;
      const cart = await Cart.findOne({ user: order.user_id?._id });

      order.products.map(async (product) => {
        await Product.findByIdAndUpdate(product?.product_id, {
          $push: {
            orders: order._id,
          },
        });
      });

      const allVariants = order.products.flatMap((p) =>
        p.variants.map((v: ProductVariant) => ({
          ...(typeof (v as any).toObject === "function"
            ? (v as any).toObject()
            : v),
          product_id: p?.product_id,
        }))
      );

      for (const orderedProduct of allVariants) {
        // update products total boxes in stocks and total boxes sold when order is delivered
        const product = (await Product.findOne({
          _id: orderedProduct.product_id,
          "variants._id": orderedProduct.id,
        })) as IProduct;

        if (product) {
          if (
            product.orders &&
            !product.orders.includes(order._id as Types.ObjectId)
          ) {
            product.orders.push(order._id as Types.ObjectId);
          }
          for (const productVariant of product.variants) {
            if (productVariant.total_boxes_in_stock !== null) {
              if (productVariant.total_boxes_in_stock <= 0) {
                productVariant.total_boxes_in_stock = 0;
              } else {
                productVariant.total_boxes_in_stock -= orderedProduct.quantity;
                productVariant.total_boxes_sold += orderedProduct.quantity;
              }
            }
          }
          await product.save();
        }
      }

      const stocklog = await StockLog.create({
        order: order?._id,
        user_id: order?.user_id?._id,
        previous_stock: order?.user_id?.total_boxes_in_stock || 0,
        new_stock:
          Number(order?.total_quantity) +
          Number(order?.user_id?.total_boxes_in_stock || 0),
        quantity: order?.total_quantity,
        type: "delivery",
        updated_by: user?._id,
        delivered_at: new Date(),
        reason: "Order delivered successfully",
      });

      await User.findByIdAndUpdate(order?.user_id?._id, {
        $inc: {
          total_boxes_in_stock: Number(order?.total_quantity || 0),
        },
        $push: {
          stock_logs: stocklog._id,
        },
      });

      if (!cart) return;
      cart.items = deleteCartComp(order.products, cart);
      cart.save();
    }

    await Order.findByIdAndUpdate(order?._id, {
      estimated_delivery_date: body.estimated_delivery_date,
      delivery_status: should_cancel_order
        ? "order_cancelled"
        : delivery_status,
      assigned_to: {
        worker_handling_order:
          order?.assigned_to?.worker_handling_order ||
          worker?.worker_id ||
          null,
      },
      confirmation: {
        auto_confirmed_at: delivery_status?.includes("delivered")
          ? dayjs().add(2, "days").toDate()
          : null,
      },

      status: order_status,
      $push: {
        delivery_steps: delivery_step,
        delivery_steps_logs: delivery_step,
        logs: log._id,
      },
    });
  }

  if (worker?.worker_id) {
    await OfficeWorker.findByIdAndUpdate(worker?.id, {
      $push: {
        logs: log?._id,
      },
    });
    await Offices.findByIdAndUpdate(worker?.office, {
      $push: {
        logs: log?._id,
      },
    });
  }
  successResponse(res, 200, "Order status updated successfully", {
    message: " Order status updated successfully by worker",
  });
  return;
};

export const cancelOrder = async (req: Request, res: Response) => {
  const _req = req as AuthRequest;
};

export const confirmOrder = async (_req: Request, res: Response) => {
  try {
    const req = _req as AuthRequest;
    const { id } = req.params;
    const order = req.order as IOrder;

    if (
      !order?.delivery_steps[
        order?.delivery_steps?.length - 1
      ]?.label?.includes("order_delivered")
    ) {
      return res.status(400).send("Order not yet delivered");
    }

    await Order.findByIdAndUpdate(order._id, {
      status: "completed",
      confirmation: {
        is_confirmed: true,
        confirmed_at: new Date(),
        method: "user",
      },
    });

    successResponse(res, 200, "Order confirmed successfully", {
      order,
    });
    return;
  } catch (error) {
    console.log("error :", error);
  }
};
