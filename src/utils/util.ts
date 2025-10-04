import { NextFunction } from "express";
// utils/checkIfExists.ts

import axios from "axios";
import { Request, Response } from "express";
import mongoose, { Document } from "mongoose";
import randomatic from "randomatic";
import { Counter } from "../models/counter";
import { sendEmail } from "../services/mail.service";
import { errorResponse, successResponse } from "./response";
import { Cart, ICart } from "../models/Cart";
import { IProduct } from "../models/Product";
import { ProductItem } from "../types/order.type";
import dayjs from "dayjs";

/**
 * Checks if a user exists by ID.
 * @param id - The MongoDB ObjectId as string.
 * @param res - Res passed down.
 * @returns The user document if found, or null.
 * @throws Error if the ID is invalid or the DB fails.
 */
export const checkIfDocumentExistsById = async <T extends Document>(
  id: string,
  itemKey: string,
  res: Response,
  Model: mongoose.Model<T>,
  populateFields?: string | string[],
  errorCode?: number
) => {
  if (populateFields) {
    const populatedDocument = await Model.findOne({
      [itemKey]: id,
    } as any).populate(populateFields);

    if (!populatedDocument) {
      errorResponse(res, errorCode || 404, "Document not found in page", {
        message: "Document not found",
      });
      return;
    }

    return populatedDocument;
  }
  const document = await Model.findOne({
    [itemKey]: id,
  } as any);
  if (!document) {
    errorResponse(res, errorCode || 404, "Document not found", {
      message: "Document not found",
    });
    return;
  }
  return document;
};

export const generateRandom = (howMuch?: number, pattern?: string) => {
  return randomatic(pattern || "a0", howMuch || 18);
};

export const customReqResHandler = async (
  res: Response,
  reqFunction: () => void,
  errorFunction?: (error: any) => void | undefined,
  responseData: {
    statusCode?: 200 | 201 | 202 | 204;
    errorStatusCode?: 400 | 401 | 403 | 404;
    successMessage: string;
    errorMessage?: string;
    data?: any;
    successData?: any;
    error?: any;
  } = {
    statusCode: 200,
    successMessage: "",
    data: null,
  },
  mailOptions: {
    shouldSendMail?: boolean;
    mailTo?: string;
    title?: string;
    message?: string;
  } = {
    shouldSendMail: false,
  }
) => {
  try {
    const response = await reqFunction();

    if (mailOptions.shouldSendMail) {
      await sendEmail(
        mailOptions.mailTo as string,
        mailOptions.title as string,
        mailOptions.message as string
      );
    }
    successResponse(
      res,
      responseData.statusCode,
      responseData.successMessage,
      responseData.data || response
    );
    return;
  } catch (error) {
    console.log("error :", error);

    errorFunction
      ? errorFunction(error)
      : errorResponse(
          res,
          responseData.errorStatusCode || 500,
          responseData.errorMessage,
          responseData.error || error
        );
  }
};

export const timestamp = {
  createdAt: "created_at",
  updatedAt: "updated_at",
};

export async function generateEntityNumber(
  entityPrefix: string,
  model: mongoose.Model<any>
) {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;

  // Find the latest entry for the current year+month
  const latest = await model
    .findOne({ entity_number: new RegExp(`^${entityPrefix}-${yearMonth}`) })
    .sort({ createdAt: -1 });

  let sequence = 1;
  if (latest) {
    const lastSeq = parseInt(latest.entity_number.split("-")[2], 10);
    sequence = lastSeq + 1;
  }

  return `${entityPrefix}-${yearMonth}-${generateRandom(6)}-${String(
    sequence
  ).padStart(4, "0")}`;
}
export const removeSensitiveFields = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (
    (req as any).worker?.worker_id ||
    (req as any).user?.user_role === "admin"
  ) {
    next();
    return;
  }
  const body = (req as any).body ?? {};
  if (!body && !req.method?.includes("GET")) {
    errorResponse(_res, 400, "No data provided in request body");
    return;
  }
  const forbidden = [
    "payment_status",
    "estimated_date",
    "estimatedDate",
    // "delivery_status",
    "refund_status",
    "order_number",
    "order_id",
    "internal_sequence",
    "last_login",
    "approved_at",
    "approved_at",
    "rejected_at",
    "approved_by",
    "rejected_by",
    "is_first_login",
    "forgot_password_expires",
    "forgot_password_token",
    "warehouse_verified",
    "total_amount",
    "discount_amount",
    "tax_amount",
    "tracking_number",
    "courier_service",
    // "payment_reference",
    "createdAt",
    "updatedAt",
    "logs",
    "status",
    "cancelled_at",
    "actual_delivery_date",
  ];

  forbidden.forEach((f) => delete body[f]);
  next();
  return;
};

export const statusMap = {
  success: "paid",
  failed: "failed",
  abandoned: "cancelled",
  ongoing: "pending",
  pending: "pending",
  processing: "pending",
  queued: "processing",
  reversed: "refunded",
};

// data: {
// with metadata
//   [1]     status: true,
//   [1]     message: 'Authorization URL created',
//   [1]     data: {
//   [1]       authorization_url: 'https://checkout.paystack.com/pxwwj3o0z3c76n1',
//   [1]       access_code: 'pxwwj3o0z3c76n1',
//   [1]       reference: 'ie6ux1e48c'
//   [1]     }
//   [1]   }

export const transactions = {
  paystackResults: [
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/8y9hub8tlf5bbdq",
        access_code: "8y9hub8tlf5bbdq",
        reference: "y91l1is09t",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/7mk9lj0fv96d4am",
        access_code: "7mk9lj0fv96d4am",
        reference: "9vco0u3cgf",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/mwvoumxtexzfloa",
        access_code: "mwvoumxtexzfloa",
        reference: "0efe4vju3q",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/qeh1sqg5h4auwd9",
        access_code: "qeh1sqg5h4auwd9",
        reference: "tfcymoth16",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/bn3sklrx6db89zz",
        access_code: "bn3sklrx6db89zz",
        reference: "tig38bxsv8",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/10gtaqc74tax218",
        access_code: "10gtaqc74tax218",
        reference: "ef4hx6i3ji",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/9lmti3hqgsfzfzv",
        access_code: "9lmti3hqgsfzfzv",
        reference: "8lhepcsawl",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/5z3x9ejpj1obieh",
        access_code: "5z3x9ejpj1obieh",
        reference: "dkdhrqt5l1",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/scsxmk7d0r8mtsa",
        access_code: "scsxmk7d0r8mtsa",
        reference: "5vqd08ie5t",
      },
    },
    {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: "https://checkout.paystack.com/jaitxd3cmtb7uxa",
        access_code: "jaitxd3cmtb7uxa",
        reference: "u7rppa3dyt",
      },
    },
  ],
};

export async function customIDGenerator<T extends Document>(
  this: Document & T & { internal_sequence?: number; [key: string]: any },
  next: NextFunction,
  db_name: string,
  keyName: string
): Promise<void> {
  if (this.isNew) {
    const today: string = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Increment sequence for today
    interface ICounter {
      sequence: number;
    }
    const counter: ICounter = await Counter.findOneAndUpdate(
      { name: db_name, date: today },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );

    const seq: number = counter.sequence;
    this.internal_sequence = seq;

    // Random 5-character alphanumeric
    const randomPart: string = generateRandom(8, "0A").toUpperCase();

    const datePart: string = today.replace(/-/g, "");
    const user_id: string = `USR-${datePart}-${randomPart}-${String(
      seq
    ).padStart(4, "0")}`;
    Object.defineProperty(this, keyName, {
      value: user_id,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  next();
}

export const paystackVerification = async (reference: string) => {
  return await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );
};

type Option = { name: string; values: string[] };

export function generateVariants(options: Option[]) {
  if (!options.length) return [];

  const cartesian = (arr: string[][]): string[][] =>
    arr.reduce((acc, val) => acc.flatMap((x) => val.map((y) => [...x, y])), [
      [],
    ] as string[][]);

  const valuesArrays = options.map((opt) => opt.values);
  const combos = cartesian(valuesArrays);
  console.log("combos :", combos);

  // build variants with "name" and "attributes"
  return combos.map((combo) => {
    const attributes = combo.map((value, idx) => ({
      key: options[idx].name,
      value,
    }));
    console.log("attributes :", attributes);

    const name = combo.join(" / "); // 👉 Small / Red

    return {
      name,
      attributes,
    };
  });
}

export const deleteCartComp = (products: ProductItem[], cart: ICart) => {
  const newItems = cart.items.map((cartItem) => {
    const allProducts = products
      .map((product) => {
        if (cartItem.variants.length > 1) {
          return;
        }
        if (product.product_id.toString() === cartItem.product.toString()) {
          return undefined;
        }
        return cartItem;
      })
      ?.filter((item) => item !== undefined);
    return allProducts;
  });
  console.log("newItems :", newItems);

  return newItems?.flat(2);
};

export const getProductAnalytics = (products: IProduct[]) => {
  return products?.map((product) => {
    const dataOrders = product?.orders
      .map((order: any) => {
        const deliveredOrder =
          order?.delivery_steps[order?.delivery_steps.length - 1];

        const isOrderDelivered = deliveredOrder.label?.includes(
          "delivered"
        ) as boolean;

        if (isOrderDelivered) {
          const total_quantity_sold = order?.total_quantity;
          const date_sold = dayjs(order?.updated_at)?.toDate();
          return {
            total_quantity_sold,
            total_amount: order?.total_amount,
            date_sold,
            isOrderDelivered,
          };
        }
        return null;
      })
      .filter((order) => !!order);
    const total_revenue_made = getSumInDays(
      dataOrders,
      30,
      (sale) => sale.total_amount
    );

    const total = dataOrders.reduce(
      (sum, item) => sum + (item.total_quantity_sold ?? 0),
      0
    );
    const total_revenue_generated = dataOrders.reduce(
      (sum, item) => sum + (item.total_amount ?? 0),
      0
    );
    return {
      product_id: product.product_id,
      product_name: product.name,
      product_image: product.product_images,
      product_description: product.description,
      category: product.category,
      quantity_in_stock: product.total_boxes_in_stock || "unlimited",
      pricing: {
        distributor_bonus_per_box: product.distributor_bonus_per_box,
        sales_agent_bonus_per_box: product.sales_agent_bonus_per_box,
        unit_type: product.unit_type,
        inventory_alert_threshold: product.inventory_alert_threshold,
        is_unlimited: product.total_boxes_in_stock == null,
        distributor_pricing: product.distributor_price_per_box,
        sales_agent_pricing: product.sales_agent_price_per_box,
      },
      units_per_box: product.units_per_box,
      minimum_order_quantity: product.min_order_quantity,
      maximum_order_quantity: product.max_order_quantity,
      status:
        product.total_boxes_in_stock == null
          ? "in_stock"
          : product.total_boxes_in_stock === 0
          ? "out_of_stock"
          : product.total_boxes_in_stock! <= product.inventory_alert_threshold
          ? "low_stock"
          : "in_stock",
      total_units_sold: total,
      unit_sold_today: getUnitsSoldInDays(dataOrders, 1),
      unit_sold_last_7_days: getUnitsSoldInDays(dataOrders, 7),
      unit_sold_last_30_days: getUnitsSoldInDays(dataOrders, 30),
      unit_sold_last_60_days: getUnitsSoldInDays(dataOrders, 60),
      unit_sold_last_90_days: getUnitsSoldInDays(dataOrders, 90),
      total_revenue_today: getSumInDays(
        dataOrders,
        1,
        (sale) => sale.total_amount
      ),
      total_revenue_last_7_days: getSumInDays(
        dataOrders,
        30,
        (sale) => sale.total_amount
      ),

      total_revenue_last_30_days: getSumInDays(
        dataOrders,
        30,
        (sale) => sale.total_amount
      ),
      total_revenue_last_60_days: getSumInDays(
        dataOrders,
        60,
        (sale) => sale.total_amount
      ),
      total_revenue_generated,
      is_archived: product.is_archived,
      is_active: product.is_active,
      is_unlimited: product.total_boxes_in_stock == null,
      total_boxes_sold: product.total_boxes_sold || 0,
      sku: product?.sku,
      variants: product.variants,
      created_at: product.created_at,
      updated_at: product.updated_at,
      // Add more fields as necessary
    };
  });
};

function getUnitsSoldInDays(data: any, days: number) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days);

  return data
    .filter(
      (sale: any) => new Date(sale.date_sold) >= cutoff && sale.isOrderDelivered
    )
    .reduce((sum: any, sale: any) => sum + sale.total_quantity_sold, 0);
}

function getSumInDays<T>(
  data: T[],
  days: number,
  extractor: (item: T) => number,
  extraFilter: (item: T) => boolean = () => true
) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days);
  return data
    .filter(
      (item: any) => new Date(item.date_sold) >= cutoff && extraFilter(item)
    )
    .reduce((sum, item) => sum + extractor(item), 0);
}

const extractLocations = (orders: any[]) => {
  return orders.map((order) => {
    if (order.shipping?.country?.length >= 1) {
      return `${order.shipping.country} - ${order.shipping.state}`;
    }
    if (order.pickup?.country?.length >= 1) {
      return `${order.pickup.country} - ${order.pickup.state}`;
    }
    return "Unknown";
  });
};
export const getLocationCounts = (orders: any[]) => {
  const locations = extractLocations(orders);

  return locations.reduce((acc: Record<string, number>, loc: string) => {
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});
};

export const brand_colors = {
  brand: {
    "25": "#fcf0eb",
    "50": "#f8e1d7",
    "100": "#f8e1d7",
    "200": "#f1c2af",
    "300": "#eba488",
    "400": "#e48560",
    "500": "#dd6738",
    "600": "#b1522d",
    "700": "#853e22",
    "800": "#582916",
    "900": "#2c150b",
    "950": "#2c150b",
  },
};
