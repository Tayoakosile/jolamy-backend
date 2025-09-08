"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOffice = exports.createNewOffices = exports.getSingleOffice = exports.getOffices = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const lodash_1 = __importDefault(require("lodash"));
const mongoose_1 = require("mongoose");
const Office_1 = __importDefault(require("../../models/Admin/Office"));
const User_1 = __importDefault(require("../../models/User"));
const activityLog_1 = require("../../utils/activityLog");
const response_1 = require("../../utils/response");
const trend_util_1 = require("../../utils/trend.util");
const util_1 = require("../../utils/util");
const getTotalCashflow = (data, period, type, name) => {
    if (period === "all") {
        return {
            name,
            value: Array.isArray(data) ? lodash_1.default.sumBy(data, "amount") : 0,
        };
    }
    return {
        name,
        value: lodash_1.default.sumBy(lodash_1.default.filter(data, (transaction) => {
            const transactionDate = (0, dayjs_1.default)(transaction.created_at);
            const today = (0, dayjs_1.default)(new Date());
            const filteredData = period === "week"
                ? (0, dayjs_1.default)(today).subtract(7, "day")
                : (0, dayjs_1.default)(today).subtract(1, "month");
            return (transaction.type === type &&
                (0, dayjs_1.default)(transactionDate).isAfter(filteredData) &&
                (0, dayjs_1.default)(transactionDate).isSame(today));
        }), "amount"),
    };
};
const getOffices = async (req, res) => {
    const _req = req;
    const user = _req.user;
    const request = async () => {
        if (user?.user_role === "admin") {
            const allOrders = await Office_1.default.find({});
            const allOfficeStats = await (0, trend_util_1.getTrend)(Office_1.default, {
                period: "week",
            });
            const activeOffices = await (0, trend_util_1.getTrend)(Office_1.default, {
                period: "week",
                filter: {
                    is_active: true,
                },
            });
            return {
                stats: [
                    {
                        title: "All Offices",
                        ...allOfficeStats,
                    },
                    {
                        title: "Active Offices",
                        ...activeOffices,
                    },
                ],
                offices: allOrders,
            };
        }
        const allOffices = await Office_1.default.find({})
            .populate("logs")
            .populate("created_by");
        return allOffices;
    };
    (0, util_1.customReqResHandler)(res, request);
};
exports.getOffices = getOffices;
const getSingleOffice = async (req, res) => {
    const _req = req;
    const id = _req.params.id;
    console.log("id :", id);
    const request = async () => {
        const single_office = await (0, util_1.checkIfDocumentExistsById)(id, "office_id", res, Office_1.default, ["created_by", "logs", "orders"]);
        const log = await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: new mongoose_1.Types.ObjectId(_req.user?._id),
            action: "GET_SINGLE_OFFICE",
            description: `${_req.user?.first_name} retrieved office details for ${single_office?.name}`,
            metadata: {
                ...single_office,
                user_id: `${_req.user?._id}`,
            },
        });
        const office = (await Office_1.default.findOne({ office_id: id })
            .populate({
            path: "created_by",
            select: "first_name last_name email user_role username email",
        })
            .populate({
            path: "logs",
            populate: [
                {
                    path: "sender",
                    select: "first_name last_name email user_role username",
                },
                {
                    path: "receiver",
                    select: "first_name last_name email user_role username",
                },
            ],
        })
            .populate({
            path: "transactions",
            populate: {
                path: "created_by",
                model: "OfficeWorker",
            },
        })
            .populate("wallet.logs")
            .populate({
            path: "workers",
            populate: [
                {
                    path: "added_by", // the nested field inside workers
                    model: "User",
                    select: "first_name last_name email user_role username",
                },
                {
                    path: "logs", // the nested field inside workers
                    model: "Log",
                    // select:"first_name last_name email user_role username",
                },
            ],
        }));
        const stats = [
            getTotalCashflow(office.transactions, "all", "", "Total Transactions"),
            getTotalCashflow(office.transactions, "week", "inflow", "Total Inflow This Week"),
            getTotalCashflow(office.transactions, "week", "outflow", "Total Outflow This Week"),
        ];
        await User_1.default.findByIdAndUpdate(_req.user?._id, {
            $push: { logs: log._id },
        });
        return {
            stats,
            office,
        };
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
const createNewOffices = async (_req, res) => {
    const req = _req;
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
const updateOffice = async (_req, res) => {
    const req = _req;
    const id = req.params.id;
    await (0, util_1.checkIfDocumentExistsById)(id, "_id", res, Office_1.default);
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
