export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const notFound = (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};

export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  if (error.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation failed';
  }

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  }

  if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body contains invalid JSON';
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File size cannot exceed 10MB';
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Only one file may be uploaded using the file field';
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = 'A user with that email already exists';
  }

  const response = { message };

  if (error.name === 'ZodError' || error.name === 'ValidationError') {
    response.errors = error.issues || Object.values(error.errors).map(({ path, message: detail }) => ({
      path,
      message: detail,
    }));
  }

  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    response.error = error.message;
  }

  res.status(statusCode).json(response);
};
