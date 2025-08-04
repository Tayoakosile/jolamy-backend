"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewOffices = exports.getSingleOffice = exports.getOffices = void 0;
const Office_1 = __importDefault(require("../../models/Admin/Office"));
const response_1 = require("../../utils/response");
const util_1 = require("../../utils/util");
const activityLog_1 = require("../../utils/activityLog");
const User_1 = __importDefault(require("../../models/User"));
const getOffices = (_req, res) => {
    const request = async () => {
        return await Office_1.default.find();
    };
    (0, util_1.customReqResHandler)(res, request);
};
exports.getOffices = getOffices;
const getSingleOffice = async (_req, res) => {
    const id = _req.params.id;
    const office = await (0, util_1.checkIfDocumentExistsById)(id, res, Office_1.default, [
        "created_by",
        "logs",
    ]);
    const request = async () => {
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
            userId: `${req.user?._id}`,
            action: "CREATE_OFFICE",
            description: "New office created",
            metadata: {
                ...newOffice,
                userId: `${req.user?._id}`,
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
    }, true, req.user?.email, "New Office Created", `A new office has been created with the name ${req.body.name}.`);
};
exports.createNewOffices = createNewOffices;
