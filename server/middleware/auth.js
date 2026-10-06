import jwt from 'jsonwebtoken';

import { AppError } from './errorHandler.js';

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not configured', 500);
  }

  return process.env.JWT_SECRET;
};

export const protect = (req, _res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return next(new AppError('Authentication token is required', 401));
  }

  const token = authorization.split(' ')[1];

  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (typeof payload !== 'object' || !payload.userId) {
      return next(new AppError('Invalid authentication token', 401));
    }

    req.user = payload;
    return next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    return next(new AppError('Invalid or expired authentication token', 401));
  }
};
