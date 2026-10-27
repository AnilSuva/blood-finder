import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const notFound: RequestHandler = (_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Route not found'));
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) return void res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request data' } });
  if (error instanceof ApiError) return void res.status(error.status).json({ error: { code: error.code, message: error.message } });
  if ((error as { code?: number }).code === 11000) return void res.status(409).json({ error: { code: 'CONFLICT', message: 'Resource already exists' } });
  logger.error({ err: error }, 'Unhandled API error');
  return void res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : 'An unexpected error occurred' } });
};
