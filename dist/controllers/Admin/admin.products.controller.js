"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveProduct = exports.updateProduct = exports.getSingleProducts = exports.getProducts = exports.addNewProducts = void 0;
const mongoose_1 = require("mongoose");
const Product_1 = require("../../models/Product");
const activityLog_1 = require("../../utils/activityLog");
const response_1 = require("../../utils/response");
const util_1 = require("../../utils/util");
const User_1 = __importDefault(require("../../models/User"));
const addNewProducts = (_req, res) => {
    const user = _req.user;
    // if (!_req.files || _req.files.length === 0)  {
    //   errorResponse(res, 400, "No files uploaded. Please upload product images.");
    // return;
    // }
    const body = _req.body;
    const request = async () => {
        const existingProduct = await Product_1.Product.findOne({
            $or: [
                {
                    name: body.name,
                    reference_id: body.reference_id,
                },
            ],
        });
        if (existingProduct) {
            return (0, response_1.errorResponse)(res, 400, "Product with this name or Reference already exists, Edit instead", {
                message: "Product with this name already exists",
                existingProduct,
            });
        }
        const product = await Product_1.Product.create({
            ..._req.body,
            // product_images: urls,
            created_by: _req.user?._id,
            is_active: true,
        });
        const log = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: new mongoose_1.Types.ObjectId(_req.user?._id),
            action: "ADD_PRODUCT",
            sender: new mongoose_1.Types.ObjectId(_req.user?._id),
            receiver: product.id,
            description: `New product added: ${product.name}`,
            metadata: {
                product_id: product._id,
                user_id: _req.user?._id,
            },
        });
        await User_1.default.findByIdAndUpdate(user?._id, {
            $push: { logs: log.id },
        });
        await Product_1.Product.findByIdAndUpdate(user?._id, {
            $push: { logs: log.id },
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
const getSingleProducts = async (_req, res) => {
    const id = _req.params.id;
    await (0, util_1.checkIfDocumentExistsById)(id, res, Product_1.Product);
    const request = async () => {
        const product = await Product_1.Product.findOne({ _id: id, is_active: true });
        const logs = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: new mongoose_1.Types.ObjectId(_req.user?._id),
            action: "GET_PRODUCT",
            sender: new mongoose_1.Types.ObjectId(_req.user?._id),
            receiver: new mongoose_1.Types.ObjectId(id),
            description: `Product fetched: ${id}`,
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
exports.getSingleProducts = getSingleProducts;
const updateProduct = async (req, res) => {
    const id = req.params.id;
    await (0, util_1.checkIfDocumentExistsById)(id, res, Product_1.Product);
    const body = req.body;
    const request = async () => {
        const log = await (0, activityLog_1.logActivity)({
            req,
            user_id: new mongoose_1.Types.ObjectId(req.user?._id),
            action: "UPDATE_PRODUCT",
            sender: new mongoose_1.Types.ObjectId(req.user?._id),
            receiver: new mongoose_1.Types.ObjectId(id),
            description: `Product updated: ${body.name}`,
            metadata: {
                product_id: id,
                user_id: req.user?._id,
            },
        });
        await Product_1.Product.findByIdAndUpdate(id, {
            ...body,
            logs: {
                $push: log.id,
            },
        }, { new: true });
        await User_1.default.findByIdAndUpdate(req.user?._id, {
            $push: { logs: log.id },
        });
        return;
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Product updated successfully",
        statusCode: 200,
    });
};
exports.updateProduct = updateProduct;
const archiveProduct = async (req, res) => {
    const id = req.params.id;
    await (0, util_1.checkIfDocumentExistsById)(id, res, Product_1.Product);
    const request = async () => {
        const log = await (0, activityLog_1.logActivity)({
            req,
            user_id: new mongoose_1.Types.ObjectId(req.user?._id),
            action: "ARCHIVE_PRODUCT",
            sender: new mongoose_1.Types.ObjectId(req.user?._id),
            receiver: new mongoose_1.Types.ObjectId(id),
            description: `Product archived: ${id}`,
            metadata: {
                product_id: id,
                user_id: req.user?._id,
            },
        });
        await User_1.default.findByIdAndUpdate(req.user?._id, {
            $push: { logs: log.id },
        });
        return await Product_1.Product.findByIdAndUpdate(id, { is_active: false, is_archived: true, logs: { $push: log.id } }, { new: true });
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Product archived successfully",
        statusCode: 200,
    });
};
exports.archiveProduct = archiveProduct;
