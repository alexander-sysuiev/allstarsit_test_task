import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../errors/httpError.js';

export const notFoundMiddleware = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new HttpError(404, 'Route not found'));
};

export const errorMiddleware = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  void _next;

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Invalid query parameters',
      issues: err.issues
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {})
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ error: message });
};
