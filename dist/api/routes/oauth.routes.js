/**
 * OAuth Routes
 * POST /auth/google - Google OAuth login
 * POST /auth/discord - Discord OAuth login
 * GET /auth/discord/callback - Discord OAuth callback
 */
import { Router } from 'express';
import { verifyGoogleToken, exchangeDiscordCode, findOrCreateOAuthUser, generateOAuthTokens } from '../oauth.js';
const router = Router();
/**
 * Google OAuth - Client sends ID token
 * POST /auth/google
 */
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ error: 'Missing ID token' });
        }
        // Verify token with Google
        const profile = await verifyGoogleToken(idToken);
        if (!profile) {
            return res.status(401).json({ error: 'Invalid Google token' });
        }
        // Find or create user
        const { user, isNew } = await findOrCreateOAuthUser(profile);
        // Generate JWT tokens
        const { token, refreshToken } = generateOAuthTokens(user);
        res.json({
            token,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                level: user.level,
                avatar: profile.avatar
            },
            isNew
        });
    }
    catch (err) {
        console.error('Google OAuth error:', err);
        res.status(500).json({ error: 'OAuth authentication failed' });
    }
});
/**
 * Discord OAuth - Exchange code for tokens
 * POST /auth/discord
 */
router.post('/discord', async (req, res) => {
    try {
        const { code, redirectUri } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'Missing authorization code' });
        }
        // Exchange code for profile
        const profile = await exchangeDiscordCode(code, redirectUri || `${process.env.FRONTEND_URL}/auth/discord/callback`);
        if (!profile) {
            return res.status(401).json({ error: 'Discord authentication failed' });
        }
        // Find or create user
        const { user, isNew } = await findOrCreateOAuthUser(profile);
        // Generate JWT tokens
        const { token, refreshToken } = generateOAuthTokens(user);
        res.json({
            token,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                level: user.level,
                avatar: profile.avatar
            },
            isNew
        });
    }
    catch (err) {
        console.error('Discord OAuth error:', err);
        res.status(500).json({ error: 'OAuth authentication failed' });
    }
});
/**
 * Get OAuth URLs for frontend
 * GET /auth/oauth-urls
 */
router.get('/oauth-urls', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        redirect_uri: `${frontendUrl}/auth/google/callback`,
        response_type: 'token id_token',
        scope: 'openid email profile',
        nonce: Math.random().toString(36).substring(2)
    })}`;
    const discordUrl = `https://discord.com/api/oauth2/authorize?${new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || '',
        redirect_uri: `${frontendUrl}/auth/discord/callback`,
        response_type: 'code',
        scope: 'identify email'
    })}`;
    res.json({
        google: googleUrl,
        discord: discordUrl
    });
});
export default router;
//# sourceMappingURL=oauth.routes.js.map