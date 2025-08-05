"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToCart = exports.getSingleProductForNotAdmin = void 0;
const util_1 = require("../utils/util");
const activityLog_1 = require("../utils/activityLog");
const mongoose_1 = require("mongoose");
const response_1 = require("../utils/response");
const Product_1 = require("../models/Product");
const User_1 = __importDefault(require("../models/User"));
const Cart_1 = require("../models/Cart");
const getSingleProductForNotAdmin = async (_req, res) => {
    const id = _req.params.id;
    await (0, util_1.checkIfDocumentExistsById)(id, res, Product_1.Product);
    const request = async () => {
        const product = await Product_1.Product.findOne({ id });
        const logs = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: new mongoose_1.Types.ObjectId(_req.user?._id),
            action: "GET_PRODUCT",
            sender: new mongoose_1.Types.ObjectId(_req.user?._id),
            receiver: new mongoose_1.Types.ObjectId(id),
            description: `User with ID ${_req.user?._id} fetched product with ID ${id}`,
            metadata: {
                product_id: id,
                user_id: _req.user?._id,
            },
        });
        await User_1.default.findByIdAndUpdate(_req.user?._id, {
            $push: { logs: logs.id },
        });
        return product;
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Product Fetched Successfully",
        statusCode: 200,
    });
};
exports.getSingleProductForNotAdmin = getSingleProductForNotAdmin;
const addToCart = (_req, res) => {
    const user_id = _req.user._id;
    const product_id = _req.params.id;
    const request = async () => {
        await (0, util_1.checkIfDocumentExistsById)(product_id, res, Product_1.Product);
        const product = await Product_1.Product.findById(product_id);
        if (!product) {
            (0, response_1.errorResponse)(res, 404, "Product not found");
            return;
        }
        const existingCart = (await Cart_1.Cart.findOne({
            items: {
                $elemMatch: {
                    products: new mongoose_1.Types.ObjectId(product_id),
                },
            },
            user_id: user_id,
        }));
        if (existingCart) {
            // If the product is already in the cart, update the quantity
            const log = await (0, activityLog_1.logActivity)({
                req: _req,
                user_id: user_id,
                action: "ADD_TO_CART",
                sender: user_id,
                receiver: new mongoose_1.Types.ObjectId(product_id),
                description: `User with ID ${user_id} added product with ID ${product_id} to cart`,
                metadata: {
                    cart_id: existingCart._id,
                    product_id: product_id,
                    user_id: user_id,
                },
            });
            await existingCart.updateOne({
                items: {
                    $push: { products: product_id, logs: existingCart.id },
                },
            });
            return { message: "Product quantity updated in cart successfully" };
        }
        const cart = (await Cart_1.Cart.create({
            user_id: user_id,
            product_id: new mongoose_1.Types.ObjectId(product_id),
            quantity: _req.body.quantity || 1, // Default to 1 if not provided
        }));
        const log = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: user_id,
            action: "ADD_TO_CART",
            sender: user_id,
            receiver: new mongoose_1.Types.ObjectId(product_id),
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
        await User_1.default.findByIdAndUpdate(user_id, {
            $push: { cart: cart._id, logs: log._id },
        });
        return { message: "Product added to cart successfully" };
    };
};
exports.addToCart = addToCart;
