import { Request, Response, NextFunction } from 'express';
import { sessionPoolManager } from '../services/sessionPoolManager.js';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const pool = sessionPoolManager.get(req.sessionID);
  if (!pool) {
    // Session exists in Redis but pool is gone (server restart or idle cleanup)
    req.session.destroy(() => {});
    res.status(401).json({ error: 'Session expired, please log in again' });
    return;
  }

  sessionPoolManager.touch(req.sessionID);
  res.locals.pool = pool;
  next();
}
