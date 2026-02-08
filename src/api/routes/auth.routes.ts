/**
 * Authentication Routes
 * POST /auth/register - Create new user account
 * POST /auth/login - Login user
 * POST /auth/refresh - Refresh JWT token
 */

import { Router, Request, Response } from 'express';
import { register, login, verifyToken, generateToken } from '../auth.js';

const router = Router();

/**
 * Register new user
 * POST /auth/register
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const result = await register(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Login user
 * POST /auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const result = await login(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

/**
 * Refresh token
 * POST /auth/refresh
 */
router.post('/refresh', (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const payload = verifyToken(refreshToken);

    if ((payload as any).type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Issue new token
    const newToken = generateToken(payload);

    res.json({ token: newToken });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

export default router;
