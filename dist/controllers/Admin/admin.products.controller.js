"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProduct = exports.getSingleProducts = exports.getProducts = exports.addNewProducts = void 0;
const mongoose_1 = require("mongoose");
const activityLog_1 = require("../../utils/activityLog");
const response_1 = require("../../utils/response");
const util_1 = require("../../utils/util");
const Product_1 = require("../../models/Product");
const addNewProducts = (_req, res) => {
    const body = _req.body;
    const request = async () => {
        const existingProduct = await Product_1.Product.exists({})
            .where("name")
            .equals(body.name);
        if (existingProduct) {
            return (0, response_1.errorResponse)(res, 400, "Product with this name already exists", {
                message: "Product with this name already exists",
            });
        }
        const product = await Product_1.Product.create({
            ..._req.body,
            created_by: _req.user?._id,
            is_active: true,
        });
        const log = await (0, activityLog_1.logActivity)({
            req: _req,
            userId: new mongoose_1.Types.ObjectId(_req.user?._id),
            action: "ADD_PRODUCT",
            sender: new mongoose_1.Types.ObjectId(_req.user?._id),
            receiver: product.id,
            description: `New product added: ${product.name}`,
            metadata: {
                productId: product._id,
            },
        });
        return { message: "Product added successfully" };
    };
    (0, util_1.customReqResHandler)(res, request);
};
exports.addNewProducts = addNewProducts;
const getProducts = (_req, res) => {
    const request = async () => {
        return await Product_1.Product.find();
    };
    (0, util_1.customReqResHandler)(res, request);
};
exports.getProducts = getProducts;
const getSingleProducts = async (_req, res) => { };
exports.getSingleProducts = getSingleProducts;
const updateProduct = async (req, res) => { };
exports.updateProduct = updateProduct;
