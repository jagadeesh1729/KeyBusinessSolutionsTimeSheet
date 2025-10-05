import { Request, Response, NextFunction } from 'express';
import Logger from '../utils/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    Logger.http(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
    );
  });

  next();
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
): void => {
  Logger.error(`Unhandled error: ${error.message}`);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
