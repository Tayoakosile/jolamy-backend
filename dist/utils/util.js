"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.brand_colors = exports.getLocationCounts = exports.getProductAnalytics = exports.deleteCartComp = exports.paystackVerification = exports.transactions = exports.statusMap = exports.removeSensitiveFields = exports.timestamp = exports.customReqResHandler = exports.generateRandom = exports.checkIfDocumentExistsById = void 0;
exports.generateEntityNumber = generateEntityNumber;
exports.customIDGenerator = customIDGenerator;
exports.generateVariants = generateVariants;
// utils/checkIfExists.ts
const axios_1 = __importDefault(require("axios"));
const randomatic_1 = __importDefault(require("randomatic"));
const counter_1 = require("../models/counter");
const mail_service_1 = require("../services/mail.service");
const response_1 = require("./response");
const dayjs_1 = __importDefault(require("dayjs"));
/**
 * Checks if a user exists by ID.
 * @param id - The MongoDB ObjectId as string.
 * @param res - Res passed down.
 * @returns The user document if found, or null.
 * @throws Error if the ID is invalid or the DB fails.
 */
const checkIfDocumentExistsById = async (id, itemKey, res, Model, populateFields, errorCode) => {
    if (populateFields) {
        const populatedDocument = await Model.findOne({
            [itemKey]: id,
        }).populate(populateFields);
        if (!populatedDocument) {
            (0, response_1.errorResponse)(res, errorCode || 404, "Document not found in page", {
                message: "Document not found",
            });
            return;
        }
        return populatedDocument;
    }
    const document = await Model.findOne({
        [itemKey]: id,
    });
    if (!document) {
        (0, response_1.errorResponse)(res, errorCode || 404, "Document not found", {
            message: "Document not found",
        });
        return;
    }
    return document;
};
exports.checkIfDocumentExistsById = checkIfDocumentExistsById;
const generateRandom = (howMuch, pattern) => {
    return (0, randomatic_1.default)(pattern || "a0", howMuch || 18);
};
exports.generateRandom = generateRandom;
const customReqResHandler = async (res, reqFunction, errorFunction, responseData = {
    statusCode: 200,
    successMessage: "",
    data: null,
}, mailOptions = {
    shouldSendMail: false,
}) => {
    try {
        const response = await reqFunction();
        if (mailOptions.shouldSendMail) {
            await (0, mail_service_1.sendEmail)(mailOptions.mailTo, mailOptions.title, mailOptions.message);
        }
        (0, response_1.successResponse)(res, responseData.statusCode, responseData.successMessage, responseData.data || response);
        return;
    }
    catch (error) {
        console.log("error :", error);
        errorFunction
            ? errorFunction(error)
            : (0, response_1.errorResponse)(res, responseData.errorStatusCode || 500, responseData.errorMessage, responseData.error || error);
    }
};
exports.customReqResHandler = customReqResHandler;
exports.timestamp = {
    createdAt: "created_at",
    updatedAt: "updated_at",
};
async function generateEntityNumber(entityPrefix, model) {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    // Find the latest entry for the current year+month
    const latest = await model
        .findOne({ entity_number: new RegExp(`^${entityPrefix}-${yearMonth}`) })
        .sort({ createdAt: -1 });
    let sequence = 1;
    if (latest) {
        const lastSeq = parseInt(latest.entity_number.split("-")[2], 10);
        sequence = lastSeq + 1;
    }
    return `${entityPrefix}-${yearMonth}-${(0, exports.generateRandom)(6)}-${String(sequence).padStart(4, "0")}`;
}
const removeSensitiveFields = (req, _res, next) => {
    if (req.worker?.worker_id ||
        req.user?.user_role === "admin") {
        next();
        return;
    }
    const body = req.body ?? {};
    if (!body && !req.method?.includes("GET")) {
        (0, response_1.errorResponse)(_res, 400, "No data provided in request body");
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
exports.removeSensitiveFields = removeSensitiveFields;
exports.statusMap = {
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
exports.transactions = {
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
async function customIDGenerator(next, db_name, keyName) {
    if (this.isNew) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const counter = await counter_1.Counter.findOneAndUpdate({ name: db_name, date: today }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
        const seq = counter.sequence;
        this.internal_sequence = seq;
        // Random 5-character alphanumeric
        const randomPart = (0, exports.generateRandom)(8, "0A").toUpperCase();
        const datePart = today.replace(/-/g, "");
        const user_id = `USR-${datePart}-${randomPart}-${String(seq).padStart(4, "0")}`;
        Object.defineProperty(this, keyName, {
            value: user_id,
            writable: true,
            enumerable: true,
            configurable: true,
        });
    }
    next();
}
const paystackVerification = async (reference) => {
    return await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
    });
};
exports.paystackVerification = paystackVerification;
function generateVariants(options) {
    if (!options.length)
        return [];
    const cartesian = (arr) => arr.reduce((acc, val) => acc.flatMap((x) => val.map((y) => [...x, y])), [
        [],
    ]);
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
const deleteCartComp = (products, cart) => {
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
exports.deleteCartComp = deleteCartComp;
const getProductAnalytics = (products) => {
    return products?.map((product) => {
        const dataOrders = product?.orders
            .map((order) => {
            const deliveredOrder = order?.delivery_steps[order?.delivery_steps.length - 1];
            const isOrderDelivered = deliveredOrder.label?.includes("delivered");
            if (isOrderDelivered) {
                const total_quantity_sold = order?.total_quantity;
                const date_sold = (0, dayjs_1.default)(order?.updated_at)?.toDate();
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
        const total_revenue_made = getSumInDays(dataOrders, 30, (sale) => sale.total_amount);
        const total = dataOrders.reduce((sum, item) => sum + (item.total_quantity_sold ?? 0), 0);
        const total_revenue_generated = dataOrders.reduce((sum, item) => sum + (item.total_amount ?? 0), 0);
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
            status: product.total_boxes_in_stock == null
                ? "in_stock"
                : product.total_boxes_in_stock === 0
                    ? "out_of_stock"
                    : product.total_boxes_in_stock <= product.inventory_alert_threshold
                        ? "low_stock"
                        : "in_stock",
            total_units_sold: total,
            unit_sold_today: getUnitsSoldInDays(dataOrders, 1),
            unit_sold_last_7_days: getUnitsSoldInDays(dataOrders, 7),
            unit_sold_last_30_days: getUnitsSoldInDays(dataOrders, 30),
            unit_sold_last_60_days: getUnitsSoldInDays(dataOrders, 60),
            unit_sold_last_90_days: getUnitsSoldInDays(dataOrders, 90),
            total_revenue_today: getSumInDays(dataOrders, 1, (sale) => sale.total_amount),
            total_revenue_last_7_days: getSumInDays(dataOrders, 30, (sale) => sale.total_amount),
            total_revenue_last_30_days: getSumInDays(dataOrders, 30, (sale) => sale.total_amount),
            total_revenue_last_60_days: getSumInDays(dataOrders, 60, (sale) => sale.total_amount),
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
exports.getProductAnalytics = getProductAnalytics;
function getUnitsSoldInDays(data, days) {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - days);
    return data
        .filter((sale) => new Date(sale.date_sold) >= cutoff && sale.isOrderDelivered)
        .reduce((sum, sale) => sum + sale.total_quantity_sold, 0);
}
function getSumInDays(data, days, extractor, extraFilter = () => true) {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - days);
    return data
        .filter((item) => new Date(item.date_sold) >= cutoff && extraFilter(item))
        .reduce((sum, item) => sum + extractor(item), 0);
}
const extractLocations = (orders) => {
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
const getLocationCounts = (orders) => {
    const locations = extractLocations(orders);
    return locations.reduce((acc, loc) => {
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
    }, {});
};
exports.getLocationCounts = getLocationCounts;
exports.brand_colors = {
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
