/**
 * Authentication Routes
 * POST /auth/register - Create new user account
 * POST /auth/login - Login user
 * POST /auth/refresh - Refresh JWT token
 */
import { Router } from 'express';
import { register, login, verifyToken, generateToken } from '../auth.js';
const router = Router();
/**
 * Register new user
 * POST /auth/register
 */
router.post('/register', async (req, res) => {
    try {
        const result = await register(req.body);
        res.status(201).json(result);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
/**
 * Login user
 * POST /auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const result = await login(req.body);
        res.status(200).json(result);
    }
    catch (err) {
        res.status(401).json({ error: err.message });
    }
});
/**
 * Refresh token
 * POST /auth/refresh
 */
router.post('/refresh', (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }
        // Verify refresh token
        const payload = verifyToken(refreshToken);
        if (payload.type !== 'refresh') {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        // Issue new token
        const newToken = generateToken(payload);
        res.json({ token: newToken });
    }
    catch (err) {
        res.status(401).json({ error: err.message });
    }
});
export default router;
//# sourceMappingURL=auth.routes.js.map