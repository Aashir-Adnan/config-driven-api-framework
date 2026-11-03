'use strict';

/**
 * An error that carries an HTTP status and a stable machine-readable code.
 * Anything thrown as an ApiError is rendered as a structured JSON response.
 */
class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const badRequest = (message, details) => new ApiError(400, 'BAD_REQUEST', message, details);
const unauthorized = (message = 'Authentication required') => new ApiError(401, 'UNAUTHORIZED', message);
const forbidden = (message = 'You do not have permission to do that') => new ApiError(403, 'FORBIDDEN', message);
const notFound = (message = 'Resource not found') => new ApiError(404, 'NOT_FOUND', message);
const unprocessable = (details) => new ApiError(422, 'VALIDATION_FAILED', 'Request validation failed', details);

module.exports = { ApiError, badRequest, unauthorized, forbidden, notFound, unprocessable };
