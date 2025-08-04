import { Request, Response } from "express";
import Offices, { IOffice } from "../../models/Admin/Office";
import { errorResponse, successResponse } from "../../utils/response";
import {
  checkIfDocumentExistsById,
  customReqResHandler,
} from "../../utils/util";
import { logActivity } from "../../utils/activityLog";
import User from "../../models/User";

interface AuthRequest extends Request {
  user?: {
    _id: string;
    is_admin: boolean;
    email: string;
  };
}

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

  const request = async () => {
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
    true,
    req.user?.email,
    "New Office Created",
    `A new office has been created with the name ${req.body.name}.`
  );
};
