"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOffice = exports.createNewOffices = exports.getSingleOffice = exports.getOffices = void 0;
const Office_1 = __importDefault(require("../../models/Admin/Office"));
const response_1 = require("../../utils/response");
const util_1 = require("../../utils/util");
const activityLog_1 = require("../../utils/activityLog");
const User_1 = __importDefault(require("../../models/User"));
const mongoose_1 = require("mongoose");
const getOffices = (_req, res) => {
    const request = async () => {
        return await Office_1.default.find();
    };
    (0, util_1.customReqResHandler)(res, request);
};
exports.getOffices = getOffices;
const getSingleOffice = async (_req, res) => {
    const id = _req.params.id;
    const office = await (0, util_1.checkIfDocumentExistsById)(id, 'office_id', res, Office_1.default, [
        "created_by",
        "logs",
    ]);
    const request = async () => {
        const log = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: new mongoose_1.Types.ObjectId(_req.user?._id),
            action: "GET_SINGLE_OFFICE",
            description: "Retrieved office details",
            metadata: {
                ...office,
                user_id: `${_req.user?._id}`,
            },
        });
        await User_1.default.findByIdAndUpdate(_req.user?._id, {
            $push: { logs: log._id },
        });
        return office;
    };
    await (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Office retrieved successfully",
        errorMessage: "Error retrieving office",
        statusCode: 200,
    });
};
exports.getSingleOffice = getSingleOffice;
/**
 *
 *
 * @param {AuthRequest} req
 * @param {Response} res
 */
const createNewOffices = (req, res) => {
    const request = async () => {
        const existingOffice = await Office_1.default.exists({})
            .where("name")
            .equals(req.body.name);
        if (existingOffice) {
            (0, response_1.errorResponse)(res, 400, "Office with this name already exists", {
                message: "Office with this name already exists",
            });
            return;
        }
        const newOffice = await Office_1.default.create({
            ...req.body,
            created_by: req.user?._id,
        });
        const log = await (0, activityLog_1.logActivity)({
            req,
            user_id: new mongoose_1.Types.ObjectId(req.user?._id),
            sender: new mongoose_1.Types.ObjectId(req.user?._id),
            receiver: new mongoose_1.Types.ObjectId(req.user?._id),
            action: "CREATE_OFFICE",
            description: "New office created",
            metadata: {
                ...newOffice,
                user_id: `${req.user?._id}`,
            },
        });
        newOffice.logs = Array.isArray(newOffice.logs)
            ? [...newOffice.logs, log._id]
            : [log._id];
        await newOffice.save();
        await User_1.default.findByIdAndUpdate(req.user?._id, {
            $push: { logs: log._id },
        });
        return newOffice;
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "New office created successfully",
        errorMessage: "Error creating new office",
        statusCode: 201,
        errorStatusCode: 400,
    }, {
        shouldSendMail: true,
        mailTo: req.user?.email,
        title: "New Office Created",
        message: `A new office has been created with the name ${req.body.name}.`,
    });
};
exports.createNewOffices = createNewOffices;
const updateOffice = async (req, res) => {
    const id = req.params.id;
    await (0, util_1.checkIfDocumentExistsById)(id, res, Office_1.default);
    const request = async () => {
        const updatedOffice = (await Office_1.default.findByIdAndUpdate(id, { ...req.body }, { new: true }));
        const log = await (0, activityLog_1.logActivity)({
            req,
            user_id: new mongoose_1.Types.ObjectId(req.user?._id),
            sender: new mongoose_1.Types.ObjectId(req.user?._id),
            receiver: new mongoose_1.Types.ObjectId(updatedOffice?._id),
            action: "UPDATE_OFFICE",
            description: "Office updated successfully",
            metadata: {
                ...updatedOffice,
                user_id: `${req.user?._id}`,
            },
        });
        updatedOffice.logs = Array.isArray(updatedOffice.logs)
            ? [...updatedOffice.logs, log._id]
            : [log._id];
        await updatedOffice.save();
        await User_1.default.findByIdAndUpdate(req.user?._id, {
            $push: { logs: log._id },
        });
        return updatedOffice;
    };
    await (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Office updated successfully",
        errorMessage: "Error updating office",
        statusCode: 200,
    });
};
exports.updateOffice = updateOffice;
