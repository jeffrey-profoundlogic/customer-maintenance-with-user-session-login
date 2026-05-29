import { Request, Response } from 'express';
import { createUserPool } from '../config/database.js';
import { sessionPoolManager } from '../services/sessionPoolManager.js';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    try {
      const pool = await createUserPool(String(username), String(password));

      // Regenerate session ID to prevent session fixation
      req.session.regenerate((err) => {
        if (err) {
          pool.end();
          res.status(500).json({ error: 'Failed to create session' });
          return;
        }

        sessionPoolManager.create(req.sessionID, String(username), pool);
        req.session.userId = String(username).toUpperCase();
        req.session.loginTime = Date.now();

        res.json({ username: req.session.userId });
      });
    } catch (error) {
      console.error('Login failed:', error);
      res.status(401).json({ error: 'Invalid credentials' });
    }
  }

  logout(req: Request, res: Response): void {
    const sessionId = req.sessionID;
    sessionPoolManager.destroy(sessionId);

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out' });
    });
  }

  me(req: Request, res: Response): void {
    if (req.session.userId) {
      res.json({ username: req.session.userId });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  }
}

export const authController = new AuthController();
