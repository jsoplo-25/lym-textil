"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, _req, res, _next) => {
    console.error('Unhandled Server Error:', err);
    const response = {
        success: false,
        error: err.message || 'Error interno del servidor.',
    };
    res.status(err.status || 500).json(response);
};
exports.errorHandler = errorHandler;
