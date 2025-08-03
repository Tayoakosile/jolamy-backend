"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
exports.successResponse = successResponse;
const errorResponse = (res, statusCode = 500, message = 'Something went wrong', error = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        error,
        statusCode
    });
};
exports.errorResponse = errorResponse;
