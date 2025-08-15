"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrder = exports.updateOrder = exports.createNewOrder = exports.getSingleOrder = exports.getAllOrders = void 0;
const mongoose_1 = require("mongoose");
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = require("../models/Product");
const Transaction_1 = __importDefault(require("../models/Transaction"));
const User_1 = __importDefault(require("../models/User"));
const activityLog_1 = require("../utils/activityLog");
const response_1 = require("../utils/response");
const util_1 = require("../utils/util");
const getAllOrders = (_req, res) => {
    const id = _req.user?._id;
    const request = async () => {
        return await Order_1.default.find({ user_id: id });
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Orders retrieved successfully",
        errorMessage: "Error retrieving orders",
        statusCode: 200,
    });
};
exports.getAllOrders = getAllOrders;
const getSingleOrder = async (_req, res) => {
    const order = _req?.order;
    // if (user_role === "admin") {
    const orderDetails = await Order_1.default.findById(order && order._id)
        .populate("products")
        .populate("logs")
        .populate("transaction_id")
        .populate("products")
        .populate({
        path: "user_id",
        select: "first_name last_name email phone_number user_role",
    });
    console.log("order?.logs :", orderDetails);
    (0, response_1.successResponse)(res, 200, "Order retrieved successfully", {
        order: orderDetails,
    });
    // }
};
exports.getSingleOrder = getSingleOrder;
const createNewOrder = (_req, res) => {
    const user = _req.user;
    const id = user?._id;
    const body = _req.body;
    const product_items = body.products;
    const request = async () => {
        const getProductPricing = async (productFromPostAPi) => {
            console.log("productFromPostAPi.id :", productFromPostAPi.id);
            const productResFromDb = productFromPostAPi?.variants
                ? await Product_1.Product.findOne({
                    _id: productFromPostAPi.id,
                    "variants._id": {
                        $in: productFromPostAPi?.variants?.map((variant) => variant.id),
                    },
                }).select("name category reference_id  available_weight is_active is_archived  variants")
                : await Product_1.Product.findOne({
                    _id: productFromPostAPi.id,
                }).select("name category reference_id  available_weight is_active is_archived  variants");
            // if a product is is_active is false or is_archived is true, return error
            if (!productResFromDb ||
                !productResFromDb?.is_active ||
                productResFromDb?.is_archived) {
                (0, response_1.errorResponse)(res, 404, "Product not found", {
                    message: `Product ${productResFromDb?.name} is not available for order.`,
                    product: productResFromDb,
                });
                return;
            }
            const theVariant = (productFromPostAPi?.variants || [])?.map((variantFromPostAPi) => {
                const matchedVariant = productResFromDb?.variants.find((v) => v.id === variantFromPostAPi.id);
                if (!user?.last_order_date &&
                    variantFromPostAPi.quantity <
                        (matchedVariant?.distributor_pricing?.first_time_min_order_qty ||
                            0)) {
                    (0, response_1.errorResponse)(res, 401, "Minimum order quantity not met", {
                        message: `Minimum order quantity for ${matchedVariant?.name} is ${matchedVariant?.distributor_pricing.first_time_min_order_qty} boxes on first order.`,
                        product: productResFromDb,
                        minimum_order_quantity: matchedVariant?.distributor_pricing.first_time_min_order_qty,
                        user_requested_quantity: variantFromPostAPi.quantity,
                    });
                    return;
                }
                console.log("matchedVariant :", variantFromPostAPi, matchedVariant);
                if (matchedVariant) {
                    // total_boxes_in_stock is null means unlimited stock,
                    // so we don't check for it  but if it is less than the requested quantity, return error
                    if (matchedVariant?.total_boxes_in_stock !== null &&
                        matchedVariant?.total_boxes_in_stock < variantFromPostAPi.quantity) {
                        (0, response_1.errorResponse)(res, 401, "Insufficient stock", {
                            message: `Insufficient stock for ${matchedVariant?.name}. Available: ${matchedVariant?.total_boxes_in_stock}, Requested: ${variantFromPostAPi.quantity}`,
                            product: productResFromDb,
                            available_stock: matchedVariant?.total_boxes_in_stock,
                            user_requested_quantity: variantFromPostAPi.quantity,
                        });
                        return;
                    }
                    // Returns the variant with all properties from the matched database variant, and the quantity and total amount.
                    return {
                        name: matchedVariant.name,
                        total_boxes_in_stock: matchedVariant.total_boxes_in_stock,
                        amount_per_box: matchedVariant.distributor_pricing.price_per_box,
                        quantity: variantFromPostAPi?.quantity || 0,
                        total_amount: (matchedVariant?.distributor_pricing?.price_per_box ?? 0) *
                            (variantFromPostAPi?.quantity || 0),
                    };
                }
                return variantFromPostAPi;
            });
            const productInfo = productResFromDb ? productResFromDb.toObject() : null;
            return {
                name: productInfo?.name || "Unknown Product",
                variants: theVariant,
                total: theVariant.reduce((sum, item) => sum + item.total_amount, 0),
                total_quantity: theVariant.reduce((sum, item) => sum + item.quantity, 0),
            };
        };
        const Products = await Promise.all(product_items.map(async (product) => getProductPricing(product)));
        console.log("Products :", Products[0].variants);
        if (Products.length === 0 || Products.some((p) => !p)) {
            (0, response_1.errorResponse)(res, 400, "No valid products found in order", {
                message: "Please check the products you are trying to order.",
            });
            return;
        }
        const order = await Order_1.default.create({
            products: Products,
            internal_notes: body.internal_notes || "",
            role: user?.user_role,
            tracking_number: `JOL-${(0, util_1.generateRandom)(12)}`,
            total_amount: Products.reduce((sum, item) => sum + item?.total, 0),
            user_id: id,
            total_quantity: Products.reduce((sum, item) => sum + item.total_quantity, 0),
        });
        const transaction = await Transaction_1.default.create({
            user_id: new mongoose_1.Types.ObjectId(id),
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
        const log = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: new mongoose_1.Types.ObjectId(id),
            action: "CREATE_ORDER",
            sender: new mongoose_1.Types.ObjectId(id),
            receiver: order._id,
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
        await User_1.default.findByIdAndUpdate(new mongoose_1.Types.ObjectId(user?.id), {
            $push: {
                orders: order._id,
                transaction_history: transaction._id,
                logs: log._id,
            },
        });
        return order;
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Order created successfully",
        errorMessage: "Error creating order",
        statusCode: 201,
    }, {
        shouldSendMail: true,
        mailTo: user?.email,
        title: "Order Confirmation",
        message: `Your order with ID ${(0, util_1.generateRandom)(12)} has been successfully created. Please proceed to fill in your delivery and payment details.`,
    });
};
exports.createNewOrder = createNewOrder;
const updateOrder = async (_req, res) => {
    const body = _req.body;
    const user = _req.user;
    const orderID = _req.params?.id;
    const order = await (0, util_1.checkIfDocumentExistsById)(orderID, "order_id", res, Order_1.default);
    const request = async () => {
        // Log that user filled in extra details of the order.. if it contains address
        const log = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: new mongoose_1.Types.ObjectId(user?._id),
            action: "UPDATE_ORDER",
            sender: new mongoose_1.Types.ObjectId(user?._id),
            receiver: order?._id,
            description: body?.shipping_location
                ? `Order updated with shipping location`
                : body?.payment_reference
                    ? "Order updated with payment information"
                    : "Order updated",
            metadata: {
                order_id: order?._id,
                user_id: user?._id,
                shipping_location: body.shipping_location,
                payment_reference: body.payment_reference,
            },
        });
        const updatedOrder = await Order_1.default.findByIdAndUpdate(orderID, {
            ...body,
            $push: { logs: log._id },
        });
        await User_1.default?.findByIdAndUpdate(user?.id, {
            $push: { logs: log._id },
            last_order_date: new Date(),
        });
        return updatedOrder;
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Order updated successfully",
        errorMessage: "Error updating order",
        statusCode: 200,
    }, {
        shouldSendMail: true,
        mailTo: _req.user?.email,
        title: "Order Update",
        message: `Your order with ID ${_req.params?.id} has been updated successfully.`,
    });
};
exports.updateOrder = updateOrder;
const cancelOrder = async (_req, res) => { };
exports.cancelOrder = cancelOrder;
