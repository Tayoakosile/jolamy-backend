"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveProduct = exports.patchProductOptions = exports.updateProductOptions = exports.updateProduct = exports.getSingleProducts = exports.getProducts = exports.addNewProducts = void 0;
const mongoose_1 = require("mongoose");
const Product_1 = require("../../models/Product");
const User_1 = __importDefault(require("../../models/User"));
const activityLog_1 = require("../../utils/activityLog");
const response_1 = require("../../utils/response");
const util_1 = require("../../utils/util");
function updateProductOptionsFunc(existingOptions, formerOptions, newOptions) {
    existingOptions.forEach((existingOption) => {
        const formerOption = formerOptions.find((opt) => opt.name.toLowerCase() === existingOption.name.toLowerCase());
        console.log("formerOption :", formerOption);
    });
}
const addNewProducts = async (req, res) => {
    const _req = req;
    const user = _req.user;
    // if (!_req.files || _req.files.length === 0)  {
    //   errorResponse(res, 400, "No files uploaded. Please upload product images.");
    // return;
    // }
    const body = _req.body;
    const updatedVariants = (0, util_1.generateVariants)(body.options ?? []);
    // return;
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
            (0, response_1.errorResponse)(res, 400, "Product with this name or Reference already exists, Edit instead", {
                message: "Product with this name already exists",
                existingProduct,
            });
            return;
        }
        const product = await Product_1.Product.create({
            ..._req.body,
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
                product_id: product.product_id,
                user_id: _req.user?._id,
            },
        });
        await User_1.default.findByIdAndUpdate(user?._id, {
            $push: { logs: log.id },
        });
        await Product_1.Product.findByIdAndUpdate(user?._id, {
            $push: { logs: log.id },
        });
        return { message: "Product added successfully", product };
    };
    (0, util_1.customReqResHandler)(res, request);
};
exports.addNewProducts = addNewProducts;
const getProducts = (req, res) => {
    const _req = req;
    const request = async () => {
        const isUserAdmin = _req.user?.is_admin;
        return isUserAdmin
            ? await Product_1.Product.find({ is_active: true })
            : await Product_1.Product.find({ is_active: true }).select("-logs -orders -inventory -created_by -is_archived -archived_at -archived_by");
    };
    (0, util_1.customReqResHandler)(res, request);
};
exports.getProducts = getProducts;
const getSingleProducts = async (req, res) => {
    const _req = req;
    const id = _req.params.id;
    const request = async () => {
        const product = await (0, util_1.checkIfDocumentExistsById)(id, "product_id", res, Product_1.Product, ["orders"]);
        const logs = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: new mongoose_1.Types.ObjectId(_req.user?._id),
            action: "GET_PRODUCT",
            sender: new mongoose_1.Types.ObjectId(_req.user?._id),
            receiver: product?._id,
            description: `Product fetched: ${id}`,
            metadata: {
                product_id: product?._id,
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
const updateProduct = async (_req, res) => {
    const req = _req;
    const id = req.params.id;
    await (0, util_1.checkIfDocumentExistsById)(id, "product_id", res, Product_1.Product);
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
            $push: { logs: log.id },
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
const updateProductOptions = async (_req, res) => {
    const req = _req;
    const id = req.params.id;
    const product = await (0, util_1.checkIfDocumentExistsById)(id, "product_id", res, Product_1.Product);
    const body = req.body;
    if (!product)
        return;
    if (!body?.options || body?.options?.length < 1) {
        (0, response_1.errorResponse)(res, 400, "Options are required");
        return;
    }
    const isProductOptionInDbBefore = product.options
        ?.map((option) => {
        const exists = body.options.find((o) => o.name?.toLowerCase() === option.name?.toLowerCase());
        if (exists) {
            return true;
        }
        return false;
    })
        .some((val) => val === true);
    if (isProductOptionInDbBefore) {
        (0, response_1.errorResponse)(res, 400, "This option already exists");
        return;
    }
    const request = async () => {
        const log = await (0, activityLog_1.logActivity)({
            req,
            user_id: new mongoose_1.Types.ObjectId(req.user?._id),
            action: "UPDATE_PRODUCT_OPTIONS",
            sender: new mongoose_1.Types.ObjectId(req.user?._id),
            description: `Product options updated: ${body.name}`,
            metadata: {
                product_id: id,
                user_id: req.user?._id,
            },
        });
        const product_options = product.options;
        const productOptionLength = product?.options?.length;
        const updated_product_options = productOptionLength >= 1
            ? [...product.options, ...body?.options]
            : body?.options;
        product.options =
            updated_product_options;
        product.variants = (0, util_1.generateVariants)(updated_product_options ?? []);
        product?.save();
        return;
        const updatedProduct = await Product_1.Product.findOneAndUpdate({ product_id: id }, {
            options: productOptionLength >= 1
                ? [...product.options, ...body?.options]
                : body?.options,
            variants: (0, util_1.generateVariants)(body.options ?? []),
            // variants:
            //   productOptionLength <= 0
            //     ? generateVariants(body.options ?? [])
            //     : [...product.variants, ...generateVariants(body.options ?? [])],
            $push: { logs: log.id },
        }, { new: true });
        await User_1.default.findByIdAndUpdate(req.user?._id, {
            $push: { logs: log.id },
        });
        return updatedProduct;
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Product updated successfully",
        statusCode: 200,
    });
};
exports.updateProductOptions = updateProductOptions;
const patchProductOptions = async (_req, res) => {
    const req = _req;
    const id = req.params.id;
    // const options = req.body;
    const former_options = req.body?.former_options;
    const new_options = req.body?.new_options;
    const product = await (0, util_1.checkIfDocumentExistsById)(id, "product_id", res, Product_1.Product);
    console.log("product?.options :", product?.options);
    const body = req.body;
    if (!product)
        return;
    // search for options that are in product.options and former_options then update the value to the value in new_options
    const updated_former_options = body.former_options.flatMap((opt) => opt.values.map((value) => ({
        name: opt.name,
        value,
    })));
    updated_former_options.map(async (opt, index) => {
        // console.log("opt :", opt);
        console.log("new_options :", new_options, index);
        // return;
        const productUpdate = await Product_1.Product.updateOne({
            _id: product?._id,
            "options.name": opt?.name,
            "options.values": opt?.value,
        }, {
            $set: {
                "options.$[opt].name": new_options[index]?.name,
                "options.$[opt].values": new_options[index]?.values,
                // overwrite the whole array
            },
        }, {
            arrayFilters: [{ "opt.name": opt?.name }],
        });
        console.log("productUpdate :", productUpdate);
    });
    console.log("updated_former_options :", updated_former_options);
    if (!body?.options || body?.options?.length < 1) {
        (0, response_1.errorResponse)(res, 400, "Options are required");
        return;
    }
    const request = async () => {
        // await Product.findOneAndUpdate({})
    };
};
exports.patchProductOptions = patchProductOptions;
const archiveProduct = async (_req, res) => {
    const req = _req;
    const id = req.params.id;
    await (0, util_1.checkIfDocumentExistsById)(id, "product_id", res, Product_1.Product);
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
        return await Product_1.Product.findByIdAndUpdate(id, { is_active: false, is_archived: true, $push: { logs: log.id } }, { new: true });
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Product archived successfully",
        statusCode: 200,
    });
};
exports.archiveProduct = archiveProduct;
