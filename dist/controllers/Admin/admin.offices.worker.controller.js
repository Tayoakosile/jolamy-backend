"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWorkerDetails = exports.getOffices = exports.addOfficeWorker = void 0;
const mongoose_1 = require("mongoose");
const Office_1 = __importDefault(require("../../models/Admin/Office"));
const OfficeWorker_1 = __importDefault(require("../../models/Admin/OfficeWorker"));
const User_1 = __importDefault(require("../../models/User"));
const mail_service_1 = require("../../services/mail.service");
const activityLog_1 = require("../../utils/activityLog");
const bcrypt_util_1 = require("../../utils/bcrypt.util");
const response_1 = require("../../utils/response");
const util_1 = require("../../utils/util");
const addOfficeWorker = (_req, res) => {
    const officeId = _req.params.id || _req.body?.office;
    const body = _req.body;
    if (!body?.email || !body?.username || !body?.password) {
        (0, response_1.errorResponse)(res, 400, "Email, username and password are required", {
            message: "Email, username and password are required",
        });
        return;
    }
    const request = async () => {
        const office = (await (0, util_1.checkIfDocumentExistsById)(officeId, "office_id", res, Office_1.default));
        const existingUser = await User_1.default.findOne({
            $or: [
                { email: body?.email?.trim().toLowerCase() },
                { username: body?.username?.trim().toLowerCase() },
            ],
        });
        const existingWorker = await OfficeWorker_1.default.findOne({
            $or: [
                { email: body?.email?.trim().toLowerCase() },
                { username: body?.username?.trim().toLowerCase() },
            ],
        });
        if (existingWorker || existingUser) {
            (0, response_1.errorResponse)(res, 400, "Worker with this email or username already exists", {
                message: `Worker with the email ${body?.email}  or username ${body?.username} already exists`,
            });
            return;
        }
        delete _req.body.office;
        const worker = (await OfficeWorker_1.default.create({
            ..._req.body,
            office: office?.id,
            office_id: office?.office_id,
            added_by: _req.user?._id,
            is_active: true,
            logs: [],
            cash_flow: [],
            orders_in_charge: [],
        }));
        const log = (await (0, activityLog_1.logActivity)({
            req: _req,
            user_id: new mongoose_1.Types.ObjectId(_req.user?._id),
            action: "ADD_OFFICE_WORKER",
            sender: _req.user?._id,
            receiver: worker.id,
            description: `New office worker added to office ${_req?.body?.office}`,
            metadata: {
                ...worker,
                officeId: _req?.body?.office,
                user_id: _req.user?.user_id,
            },
        }));
        await Office_1.default.findOneAndUpdate({ office_id: officeId }, {
            $push: { workers: worker._id, logs: log._id },
        });
        await OfficeWorker_1.default.findByIdAndUpdate(worker._id, {
            $push: { logs: log._id },
        });
        return {
            worker,
            password: _req.body.password,
            officeId: _req.body?.office,
        };
    };
    const mailOptions = {
        shouldSendMail: true,
        mailTo: body.email,
        title: "New Office Worker Added",
        message: `You have been added as a worker in the office ${officeId}.`,
    };
    (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "New office worker added successfully",
        errorMessage: "Error adding new office worker",
        statusCode: 201,
        errorStatusCode: 400,
    }, mailOptions);
};
exports.addOfficeWorker = addOfficeWorker;
const getOffices = (_req, res) => {
    const request = async () => {
        return await Office_1.default.find();
    };
    (0, util_1.customReqResHandler)(res, request);
};
exports.getOffices = getOffices;
/**
 *
 *
 * @param {AuthRequest} req
 * @param {Response} res
 */
const updateWorkerDetails = async (req, res) => {
    const id = req.params.worker_id;
    const office_id = req.params.id;
    // if password or email is included then a mail has to be sent with the updated password
    const request = async () => {
        await (0, util_1.checkIfDocumentExistsById)(office_id, "office_id", res, Office_1.default);
        const officeWorker = (await (0, util_1.checkIfDocumentExistsById)(id, "worker_id", res, OfficeWorker_1.default));
        delete req.body.email;
        const updatedOfficeWorker = (await OfficeWorker_1.default.findOneAndUpdate({ worker_id: id }, {
            ...req.body,
            email: officeWorker.email,
            password: req.body.password
                ? await (0, bcrypt_util_1.encrypt)(req.body.password)
                : officeWorker.password,
        }, { new: true }));
        if (req.body.password) {
            (0, mail_service_1.sendEmail)(updatedOfficeWorker.email, "Password Updated", `Your password has been updated. Your new password is: ${req.body.password}`);
        }
        const log = await (0, activityLog_1.logActivity)({
            req,
            user_id: new mongoose_1.Types.ObjectId(req.user?._id),
            action: "UPDATE_OFFICE_WORKER",
            description: "Office worker details updated",
            sender: new mongoose_1.Types.ObjectId(req.user?._id),
            receiver: id || updatedOfficeWorker._id,
            metadata: {
                user_id: req.user?._id,
            },
        });
        await OfficeWorker_1.default.findByIdAndUpdate(updatedOfficeWorker._id, {
            $push: { logs: log._id },
        });
        return updatedOfficeWorker;
    };
    await (0, util_1.customReqResHandler)(res, request, undefined, {
        successMessage: "Office Worker details updated successfully",
        errorMessage: "Error updating office details",
        statusCode: 200,
    });
};
exports.updateWorkerDetails = updateWorkerDetails;
