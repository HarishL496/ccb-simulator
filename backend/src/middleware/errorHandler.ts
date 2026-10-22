import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error('[ERROR]', err.message, err.stack);
  res.status(500).json({ success: false, error: 'Internal server error', message: err.message });
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
}
