import { Request, Response } from "express";
import Offices, { IOffice } from "../../models/Admin/Office";
import { errorResponse, successResponse } from "../../utils/response";
import {
  checkIfDocumentExistsById,
  customReqResHandler,
} from "../../utils/util";
import { logActivity } from "../../utils/activityLog";
import User from "../../models/User";
import { IOfficeWorker, OfficeWorker } from "../../models/Admin/OfficeWorker";
import { Types } from "mongoose";
import { encrypt } from "../../utils/bcrypt.util";
import { sendEmail } from "../../services/mail.service";
import { send } from "process";

interface AuthRequest extends Request {
  user?: {
    _id: string;
    is_admin: boolean;
    email: string;
  };
}

export const addOfficeWorker = (_req: AuthRequest, res: Response) => {
  const officeId = _req.params.id;
  console.log("officeId :", officeId);

  const body = _req.body;
  const request = async () => {
    const office = (await checkIfDocumentExistsById<IOffice>(
      officeId,
      res,
      Offices
    )) as IOffice;

    const existingWorker = await User.exists({})
      .where("email")
      .equals(body.email.trim().toLowerCase());
    if (existingWorker) {
      return errorResponse(res, 400, "Worker with this email already exists", {
        message: "Worker with this email already exists",
      });
    }
    const worker = (await OfficeWorker.create({
      ..._req.body,
      added_by: _req.user?._id,
      is_active: true,
      office: office._id,
      logs: [],
      cash_flow: [],
      orders_in_charge: [],
    })) as IOfficeWorker;

    const log = (await logActivity({
      req: _req,
      userId: new Types.ObjectId(_req.user?._id),
      action: "ADD_OFFICE_WORKER",
      sender: new Types.ObjectId(_req.user?._id),
      receiver: worker.id,
      description: `New office worker added to office ${office.name}`,
      metadata: {
        ...worker,
        officeId: office._id,
        userId: new Types.ObjectId(_req.user?._id),
      },
    })) as any;

    await Offices.findByIdAndUpdate(officeId, {
      $push: { workers: worker._id, logs: log._id },
    });
    await OfficeWorker.findByIdAndUpdate(worker._id, {
      $push: { logs: log._id },
    });

    return { worker, password: _req.body.password, officeId: office._id };
  };
  const mailOptions = {
    shouldSendMail: true,
    mailTo: body.email,
    title: "New Office Worker Added",
    message: `You have been added as a worker in the office ${officeId}.`,
  };
  customReqResHandler(
    res,
    request,
    undefined,
    {
      successMessage: "New office worker added successfully",
      errorMessage: "Error adding new office worker",
      statusCode: 201,
      errorStatusCode: 400,
    },
    mailOptions
  );
};

export const getOffices = (_req: AuthRequest, res: Response) => {
  const request = async () => {
    return await Offices.find();
  };
  customReqResHandler(res, request);
};
export const getSingleOffice = async (_req: AuthRequest, res: Response) => {
  const id = _req.params.id;
  const office = await checkIfDocumentExistsById<IOffice>(id, res, Offices, [
    "created_by",
    "logs",
  ]);

  const request = () => {
    return office;
  };

  await customReqResHandler(res, request, undefined, {
    successMessage: "Office retrieved successfully",
    errorMessage: "Error retrieving office",
    statusCode: 200,
  });
};
/**
 *
 *
 * @param {AuthRequest} req
 * @param {Response} res
 */

export const updateWorkerDetails = async (req: AuthRequest, res: Response) => {
  const id = req.params.worker_id;
  const office_id = req.params.id;
  // if password or email is included then a mail has to be sent with the updated password

  const request = async () => {
    await checkIfDocumentExistsById<IOffice>(office_id, res, Offices);
    const officeWorker = (await checkIfDocumentExistsById<IOfficeWorker>(
      id,
      res,
      OfficeWorker
    )) as IOfficeWorker;
    delete req.body.email;
    const updatedOfficeWorker = (await OfficeWorker.findByIdAndUpdate(
      id,
      {
        ...req.body,
        email: officeWorker.email,
        password: req.body.password
          ? await encrypt(req.body.password)
          : officeWorker.password,
      },
      { new: true }
    )) as IOfficeWorker;
    if (req.body.password) {
      sendEmail(
        updatedOfficeWorker.email,
        "Password Updated",
        `Your password has been updated. Your new password is: ${req.body.password}`
      );
    }

    const log = await logActivity({
      req,
      userId: new Types.ObjectId(req.user?._id),
      action: "UPDATE_OFFICE_WORKER",
      description: "Office worker details updated",
      sender: new Types.ObjectId(req.user?._id),
      receiver: (id as unknown as Types.ObjectId) || updatedOfficeWorker._id,
      metadata: {
        userId: req.user?._id,
      },
    });

    await OfficeWorker.findByIdAndUpdate(updatedOfficeWorker._id, {
      $push: { logs: log._id },
    });
    return updatedOfficeWorker;
  };

  await customReqResHandler(res, request, undefined, {
    successMessage: "Office Worker details updated successfully",
    errorMessage: "Error updating office details",
    statusCode: 200,
  });
};
