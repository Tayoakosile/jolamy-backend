"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewOffices = exports.getOffices = void 0;
const Office_1 = __importDefault(require("../../models/Admin/Office"));
const util_1 = require("../../utils/util");
const activityLog_1 = require("../../utils/activityLog");
const getOffices = (_req, res) => {
    const request = async () => {
        return await Office_1.default.find();
    };
    (0, util_1.customReqResHandler)(_req, res, request);
};
exports.getOffices = getOffices;
const createNewOffices = (req, res) => {
    const request = async () => {
        const newOffice = await Office_1.default.create({
            ...req.body,
            created_by: req.user?._id,
        });
        (0, activityLog_1.logActivity)({
            req,
            userId: `${req.user?._id}`,
            action: "CREATE_OFFICE",
            description: "New office created",
            metadata: {
                officeId: newOffice._id,
                officeName: newOffice.name,
            },
        });
        return newOffice.save();
    };
    (0, util_1.customReqResHandler)(req, res, request);
};
exports.createNewOffices = createNewOffices;
