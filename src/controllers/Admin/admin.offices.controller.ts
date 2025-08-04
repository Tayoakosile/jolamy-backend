import { Request, Response } from "express";
import Offices from "../../models/Admin/Office";
import { errorResponse, successResponse } from "../../utils/response";
import { customReqResHandler } from "../../utils/util";
import { logActivity } from "../../utils/activityLog";

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
  customReqResHandler(_req, res, request);
};

export const createNewOffices = (req: AuthRequest, res: Response) => {
  const request = async () => {

    const newOffice = await Offices.create({
      ...req.body,
      created_by: req.user?._id,

    });
    logActivity({
      req,
      userId: `${req.user?._id}`,
      action: "CREATE_OFFICE",
      description: "New office created",
      metadata: {
        officeId: newOffice._id,
        officeName: newOffice.name,
      },
    })
    return newOffice.save();
  };

  customReqResHandler(req, res, request);
};
