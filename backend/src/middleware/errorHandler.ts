import { NextFunction, Request, Response } from 'express';

// Central error handler: hides internal details from clients while
// logging them server-side. Must be registered LAST in server.ts.
export function errorHandler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // eslint-disable-next-line no-console
  console.error(err);
  const status = typeof err?.status === 'number' ? err.status : 500;
  const message =
    status === 500 ? 'Internal server error' : err?.message ?? 'Request failed';
  res.status(status).json({ message });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Not found' });
}
