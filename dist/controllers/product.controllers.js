"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSingleProductForNotAdmin = void 0;
const activityLog_1 = require("../utils/activityLog");
const util_1 = require("../utils/util");
const mongoose_1 = require("mongoose");
const Product_1 = require("../models/Product");
const User_1 = __importDefault(require("../models/User"));
const getSingleProductForNotAdmin = async (req, res) => {
    const _req = req;
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
