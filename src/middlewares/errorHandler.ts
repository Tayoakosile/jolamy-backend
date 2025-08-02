// src/middlewares/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode =
    err instanceof AppError ? err.statusCode : 500;

  const message = err.message || 'Something went wrong';

  return res.status(statusCode).json({
    success: false,
    message,
  });
};
