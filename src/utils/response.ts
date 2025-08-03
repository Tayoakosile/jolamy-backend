import { Response } from "express";

export const successResponse = (
  res: Response,
  statusCode: number = 200,
  message: string = "Success",
  data: any = null
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  statusCode: number = 500,
  message: string = "Something went wrong",
  error: any = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error ? error : { message },
    statusCode,
  });
};
