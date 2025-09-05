"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCart = exports.addToCart = exports.getSingleProductForNotAdmin = void 0;
const activityLog_1 = require("../utils/activityLog");
const util_1 = require("../utils/util");
const mongoose_1 = require("mongoose");
const Cart_1 = require("../models/Cart");
const Product_1 = require("../models/Product");
const User_1 = __importDefault(require("../models/User"));
const response_1 = require("../utils/response");
const getSingleProductForNotAdmin = async (_req, res) => {
    const id = _req.params.id;
    await (0, util_1.checkIfDocumentExistsById)(id, "product_id", res, Product_1.Product);
    const request = async () => {
        const product = await Product_1.Product.findOne({ _id: id });
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
const addToCart = (req, res) => {
    const _req = req;
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
            const singleCart = await Cart_1.Cart.updateOne({ "items.variants._id": variantId, "items.product": product._id }, {
                $set: {
                    "items.$[i].variants.$[j].quantity": variant.quantity,
                },
            }, {
                arrayFilters: [
                    { "i.variants._id": variantId },
                    { "j._id": variantId },
                ],
            });
            if (singleCart && singleCart.modifiedCount === 0) {
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
const getCart = (_req, res) => {
    const user_id = _req.user._id;
    const request = async () => {
        const cart = await Cart_1.Cart.findOne({ user: user_id }).populate("items.product");
        if (!cart) {
            (0, response_1.errorResponse)(res, 404, "Cart not found");
            return;
        }
        const logs = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: new mongoose_1.Types.ObjectId(_req.user?._id),
            action: "GET_CART",
            sender: new mongoose_1.Types.ObjectId(_req.user?._id),
            receiver: cart._id,
            description: `User with ID ${_req.user?.user_id} fetched cart with product`,
            metadata: {
                cart_id: cart._id,
                user_id: _req.user?._id,
            },
        });
        await User_1.default.findByIdAndUpdate(_req.user?._id, {
            $push: { logs: logs.id },
        });
        return cart;
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Cart retrieved successfully",
        statusCode: 200,
    });
};
exports.getCart = getCart;
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
