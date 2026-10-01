"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, _req, res, _next) => {
    console.error('Unhandled Server Error:', err);
    const status = err.status || err.statusCode || 500;
    const response = {
        success: false,
        error: err.message || 'Error interno del servidor.',
    };
    res.status(status).json(response);
};
exports.errorHandler = errorHandler;
