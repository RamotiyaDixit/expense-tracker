import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
    return;
  }

  if (error instanceof Error && error.message) {
    res.status(400).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
};
