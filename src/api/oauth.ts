/**
 * OAuth Authentication - Google & Discord
 * Handles OAuth2 flows and user linking
 */

import jwt from 'jsonwebtoken';
import pool from '../database/connection';

export interface OAuthProfile {
  provider: 'google' | 'discord';
  providerId: string;
  email: string;
  username: string;
  avatar?: string;
}

/**
 * Find or create user from OAuth profile
 */
export async function findOrCreateOAuthUser(profile: OAuthProfile) {
  // Check if OAuth account already linked
  const existingOAuth = await pool.query(
    `SELECT u.* FROM users u
     JOIN user_oauth_accounts oa ON u.id = oa.user_id
     WHERE oa.provider = $1 AND oa.provider_id = $2`,
    [profile.provider, profile.providerId]
  );

  if (existingOAuth.rows.length > 0) {
    // User exists, return them
    const user = existingOAuth.rows[0];
    return {
      user,
      isNew: false
    };
  }

  // Check if email already exists (link accounts)
  const existingEmail = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [profile.email]
  );

  let user;
  let isNew = false;

  if (existingEmail.rows.length > 0) {
    // Link OAuth to existing account
    user = existingEmail.rows[0];
  } else {
    // Try to create new user, but handle duplicate email gracefully
    const username = await generateUniqueUsername(profile.username);
    try {
      const result = await pool.query(
        `INSERT INTO users (email, username, password_hash, gold)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [profile.email, username, 'OAUTH_USER', 1000]
      );
      user = result.rows[0];
      isNew = true;
    } catch (err: any) {
      // Email already exists - fetch it and use it
      if (err.code === '23505') {
        const existing = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [profile.email]
        );
        user = existing.rows[0];
        isNew = false;
      } else {
        throw err;
      }
    }
  }

  // Link OAuth account
  await pool.query(
    `INSERT INTO user_oauth_accounts (user_id, provider, provider_id, avatar_url)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (provider, provider_id) DO UPDATE SET avatar_url = $4`,
    [user.id, profile.provider, profile.providerId, profile.avatar]
  );

  return { user, isNew };
}

/**
 * Generate unique username if taken
 */
async function generateUniqueUsername(baseUsername: string): Promise<string> {
  // Clean username
  let username = baseUsername
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 40);

  if (!username || username.length < 3) {
    username = 'player';
  }

  // Check if taken
  const existing = await pool.query(
    'SELECT id FROM users WHERE username = $1',
    [username]
  );

  if (existing.rows.length === 0) {
    return username;
  }

  // Add random suffix
  const suffix = Math.floor(Math.random() * 9999);
  return `${username}${suffix}`;
}

/**
 * Generate tokens for OAuth user
 */
export function generateOAuthTokens(user: any) {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username
    },
    process.env.JWT_SECRET || 'dev-secret-change-in-production',
    { expiresIn: '24h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_SECRET || 'dev-secret-change-in-production',
    { expiresIn: '7d' }
  );

  return { token, refreshToken };
}

/**
 * Verify Google OAuth token - Decode JWT without verification (for testing)
 * In production, verify signature with Google's public keys
 */
export async function verifyGoogleToken(idToken: string): Promise<OAuthProfile | null> {
  try {
    // Decode JWT manually (don't verify signature for testing)
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode the payload (second part)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    // For production, you should verify the signature
    // For now, just trust the payload

    return {
      provider: 'google',
      providerId: payload.sub,
      email: payload.email,
      username: payload.name || payload.email.split('@')[0],
      avatar: payload.picture
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    return null;
  }
}

/**
 * Exchange Discord code for user profile
 */
export async function exchangeDiscordCode(code: string, redirectUri: string): Promise<OAuthProfile | null> {
  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || '',
        client_secret: process.env.DISCORD_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      console.error('Discord token exchange failed');
      return null;
    }

    const tokens = await tokenResponse.json() as any;

    // Get user profile
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });

    if (!userResponse.ok) {
      console.error('Discord user fetch failed');
      return null;
    }

    const discordUser = await userResponse.json();

    return {
      provider: 'discord',
      providerId: (discordUser as any).id,
      email: (discordUser as any).email,
      username: (discordUser as any).username,
      avatar: (discordUser as any).avatar
        ? `https://cdn.discordapp.com/avatars/${(discordUser as any).id}/${(discordUser as any).avatar}.png`
        : undefined
    };
  } catch (error) {
    console.error('Discord OAuth failed:', error);
    return null;
  }
}
