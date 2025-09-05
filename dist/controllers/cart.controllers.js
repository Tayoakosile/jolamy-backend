"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCart = exports.getCarts = exports.addToCart = void 0;
const activityLog_1 = require("../utils/activityLog");
const util_1 = require("../utils/util");
const mongoose_1 = require("mongoose");
const Cart_1 = require("../models/Cart");
const Product_1 = require("../models/Product");
const User_1 = __importDefault(require("../models/User"));
const response_1 = require("../utils/response");
const addToCart = (_req, res) => {
    const user_id = _req.user._id;
    const product_id = _req.body?.product_id;
    const variants = _req.body?.variants || [];
    if (!product_id) {
        (0, response_1.errorResponse)(res, 400, "Product ID is required");
        return;
    }
    const request = async () => {
        const product = await (0, util_1.checkIfDocumentExistsById)(product_id, "product_id", res, Product_1.Product, undefined, 400);
        if (!product) {
            return;
        }
        const existingCart = (await Cart_1.Cart.findOne({
            user: user_id,
        }));
        console.log('existingCart :', existingCart);
        if (!existingCart) {
            const cart = (await Cart_1.Cart.create({
                user: user_id,
                items: [
                    {
                        product: product._id,
                        variants: [..._req.body?.variants],
                    },
                ],
            }));
            const log = await (0, activityLog_1.logActivity)({
                req: _req,
                user_id: user_id,
                action: "ADD_TO_CART",
                sender: user_id,
                receiver: product?._id,
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
        }
        for (const variant of variants) {
            const variantId = variant._id;
            const singleCart = await Cart_1.Cart.updateOne({ "items.variants._id": variantId }, {
                $set: {
                    "items.$[i].variants.$[j].quantity": variant.quantity,
                },
            }, {
                arrayFilters: [
                    { "i.variants._id": variantId },
                    { "j._id": variantId },
                ],
            });
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
        const log = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: user_id,
            action: "ADD_TO_CART",
            sender: user_id,
            receiver: product?._id,
            description: `User with ID ${user_id} added product with ID ${product_id} to cart`,
            metadata: {
                cart_id: existingCart._id,
                product_id: product_id,
                user_id: user_id,
            },
        });
        await User_1.default.findByIdAndUpdate(user_id, {
            $push: { cart: existingCart._id, logs: log._id },
        });
        return { message: "Product quantity updated in cart successfully" };
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Product added to cart successfully",
        errorMessage: "Error adding product to cart",
        statusCode: 200,
    });
};
exports.addToCart = addToCart;
const getCarts = (req, res) => {
    const _req = req;
    const user_id = _req?.user?._id;
    const request = async () => {
        const cart = (await Cart_1.Cart.findOne({ user: user_id }).populate({
            path: "items.product",
            select: "-created_by  -orders -is_archived -logs -inventory",
        }));
        const updatedCart = cart?.toObject()?.items.map((item) => {
            return item.variants.map((originalVariant) => {
                const variant = item.product.variants.find((v) => v._id.toString() === originalVariant._id.toString());
                const { variants, ...rest } = item.product;
                if (variant) {
                    return {
                        ...variant,
                        variant_name: originalVariant.name || "",
                        ...rest,
                        variant_id: originalVariant?._id,
                        original_product_id: item.product?._id,
                        quantity: originalVariant?.quantity || 0,
                        total_price: originalVariant?.quantity *
                            variant?.distributor_pricing?.price_per_box || 0,
                    };
                }
            });
        });
        const logs = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: new mongoose_1.Types.ObjectId(_req.user?._id),
            action: "GET_CART",
            sender: new mongoose_1.Types.ObjectId(_req.user?._id),
            receiver: _req.user?._id,
            description: `User with ID ${_req.user?.user_id} fetched cart with product`,
            metadata: {
                cart_id: cart?._id || "",
                user_id: _req.user?._id,
            },
        });
        await User_1.default.findByIdAndUpdate(_req.user?._id, {
            $push: { logs: logs.id },
        });
        return { cart, checkout: updatedCart };
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Cart retrieved successfully",
        statusCode: 200,
    });
};
exports.getCarts = getCarts;
const deleteCart = async (_req, res) => {
    const req = _req;
    const id = req.params?.id;
    console.log(" :", req.params, req.body, "_req.body");
    console.log("req.user?._id :", req.user?._id);
    // return;
    //
    const request = async () => {
        const user_id = req.user?._id;
        // const cart = (await Cart.findOneAndDelete({ user: user_id })) as ICart;
        const cart = await Cart_1.Cart.findOneAndUpdate({ user: user_id, "items.product": req.body.product_id }, { $pull: { items: { "variants._id": { _id: req.body?.variant_id } } } }, { new: true });
        const findCart = await Cart_1.Cart.findOne({
            user: user_id,
            "items.product": req.body.product_id,
        });
        console.log("findCart :", findCart);
        console.log("cart :", cart);
        return;
        // await User.findByIdAndUpdate(user_id, { $pull: { cart: cart?._id } });
        await (0, activityLog_1.logActivity)({
            req,
            user_id,
            action: "DELETE_CART",
            sender: user_id,
            receiver: cart?._id,
            description: `User with name ${req.user?.first_name} ${req.user?.last_name} deleted cart with ID ${cart?._id}`,
            metadata: {
                cart_id: cart?._id,
                user_id,
            },
        });
        res.status(200).json({ message: "Cart deleted successfully" });
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Cart deleted successfully",
        errorMessage: "Error deleting cart",
        statusCode: 200,
    });
};
exports.deleteCart = deleteCart;
