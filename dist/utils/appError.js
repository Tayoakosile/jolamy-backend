"use strict";
// src/utils/appError.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 400, isOperational = true) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this);
    }
}
exports.AppError = AppError;
