import { Response } from "express";

export const successResponse = (
  res: Response,
  statusCode: number = 200,
  message: string = "Success",
  data: any = null
) => {
  if (res.headersSent) return;
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
  return;
};

export const errorResponse = (
  res: Response,
  statusCode: number = 500,
  message: string = "Something went wrong",
  error: any = null
) => {
  if (res.headersSent) return;
  res.status(statusCode).json({
    success: false,
    message,
    error: error ? error : { message },
    statusCode,
  });
  return;
};
