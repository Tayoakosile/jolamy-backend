import { Request, Response } from "express";
import Offices, { IOffice } from "../../models/Admin/Office";
import { errorResponse, successResponse } from "../../utils/response";
import {
  checkIfDocumentExistsById,
  customReqResHandler,
} from "../../utils/util";
import { logActivity } from "../../utils/activityLog";
import User from "../../models/User";
import { OfficeWorker } from "../../models/Admin/OfficeWorker";

interface AuthRequest extends Request {
  user?: {
    _id: string;
    is_admin: boolean;
    email: string;
  };
}

export const addOfficeWorker = (_req: AuthRequest, res: Response) => {
  const officeId = _req.params.officeId;
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
      errorResponse(res, 400, "Worker with this email already exists", {
        message: "Worker with this email already exists",
      });
      return;
    }
    const worker = await OfficeWorker.create({
      ..._req.body,
      added_by: _req.user?._id,
      is_active: true,
      office: office._id,
      logs: [],
      cash_flow: [],
      orders_in_charge: [],
    });
    Offices.findByIdAndUpdate(officeId, {
      $push: { workers: worker._id },
    });

    return worker;
  };
  const mailOptions = {};
  customReqResHandler(res, request);
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
export const createNewOffices = (req: AuthRequest, res: Response) => {
  const request = async () => {
    const existingOffice = await Offices.exists({})
      .where("name")
      .equals(req.body.name);
    if (existingOffice) {
      errorResponse(res, 400, "Office with this name already exists", {
        message: "Office with this name already exists",
      });
      return;
    }
    const newOffice = await Offices.create({
      ...req.body,
      created_by: req.user?._id,
    });
    const log = await logActivity({
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
    await User.findByIdAndUpdate(req.user?._id, {
      $push: { logs: log._id },
    });
    return newOffice;
  };

  customReqResHandler(
    res,
    request,
    undefined,
    {
      successMessage: "New office created successfully",
      errorMessage: "Error creating new office",
      statusCode: 201,
      errorStatusCode: 400,
    },
    {
      mailTo: req.user?.email,
      title: "New Office Created",
      message: `A new office has been created with the name ${req.body.name}.`,
    }
  );
};

export const updateOffice = async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  await checkIfDocumentExistsById<IOffice>(id, res, Offices);

  const request = async () => {
    const updatedOffice = (await Offices.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    )) as IOffice;

    const log = await logActivity({
      req,
      userId: `${req.user?._id}`,
      action: "UPDATE_OFFICE",
      description: "Office updated successfully",
      metadata: {
        ...updatedOffice,
        userId: `${req.user?._id}`,
      },
    });
    updatedOffice.logs = Array.isArray(updatedOffice.logs)
      ? [...updatedOffice.logs, log._id]
      : [log._id];
    await updatedOffice.save();
    await User.findByIdAndUpdate(req.user?._id, {
      $push: { logs: log._id },
    });
    return updatedOffice;
  };

  await customReqResHandler(res, request, undefined, {
    successMessage: "Office updated successfully",
    errorMessage: "Error updating office",
    statusCode: 200,
  });
};
