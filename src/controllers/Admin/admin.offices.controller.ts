import { Request, Response } from "express";
import Offices, { IOffice } from "../../models/Admin/Office";
import { errorResponse, successResponse } from "../../utils/response";
import {
  checkIfDocumentExistsById,
  customReqResHandler,
} from "../../utils/util";
import { logActivity } from "../../utils/activityLog";
import User from "../../models/User";
import { Types } from "mongoose";
import { AuthRequest } from "../../types/type";

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
    const log = await logActivity({
      req: _req,
      user_id: new Types.ObjectId(_req.user?._id),
      action: "GET_SINGLE_OFFICE",
      description: "Retrieved office details",
      metadata: {
        ...office,
        user_id: `${_req.user?._id}`,
      },
    });

    await User.findByIdAndUpdate(_req.user?._id, {
      $push: { logs: log._id },
    });
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
      user_id: new Types.ObjectId(req.user?._id),
      sender: new Types.ObjectId(req.user?._id),
      receiver: new Types.ObjectId(req.user?._id),
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
      shouldSendMail: true,
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
      user_id: new Types.ObjectId(req.user?._id),
      sender: new Types.ObjectId(req.user?._id),
      receiver: new Types.ObjectId(updatedOffice?._id),
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
