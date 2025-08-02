"use strict";
// src/middlewares/errorHandler.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const appError_1 = require("../utils/appError");
const errorHandler = (err, req, res, _next) => {
    const statusCode = err instanceof appError_1.AppError ? err.statusCode : 500;
    const message = err.message || 'Something went wrong';
    return res.status(statusCode).json({
        success: false,
        message,
    });
};
exports.errorHandler = errorHandler;
