/**
 * Authentication Service
 * Handles user registration, login, and JWT token management
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import pool from '../database/connection';

// Validation schemas
const RegisterSchema = z.object({
  email: z.string().email('Invalid email'),
  username: z.string().min(3).max(50),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string()
});

export interface JWTPayload {
  id: string;
  email: string;
  username: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    level: number;
  };
}

/**
 * Register a new user
 */
export async function register(data: any): Promise<AuthResponse> {
  // Validate input
  const validated = RegisterSchema.parse(data);

  // Check if user exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [validated.email, validated.username]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('Email or username already in use');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(validated.password, 12);

  // Create user
  const result = await pool.query(
    `INSERT INTO users (email, username, password_hash, gold)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, username, level, gold`,
    [validated.email, validated.username, passwordHash, 1000]
  );

  const user = result.rows[0];

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      level: user.level
    }
  };
}

/**
 * Login existing user
 */
export async function login(data: any): Promise<AuthResponse> {
  // Validate input
  const validated = LoginSchema.parse(data);

  // Find user
  const result = await pool.query(
    'SELECT id, email, username, level, password_hash FROM users WHERE email = $1 AND deleted_at IS NULL',
    [validated.email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];

  // Verify password
  const passwordValid = await bcrypt.compare(validated.password, user.password_hash);
  if (!passwordValid) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  await pool.query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      level: user.level
    }
  };
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev-secret-change-in-production'
    ) as JWTPayload;
    return decoded;
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generate JWT token
 */
export function generateToken(user: any): string {
  const expiryHours = 24;
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    id: user.id,
    email: user.email,
    username: user.username
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret-change-in-production', {
    expiresIn: `${expiryHours}h`
  });
}

/**
 * Generate refresh token (longer lived)
 */
function generateRefreshToken(user: any): string {
  const payload = {
    id: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret-change-in-production', {
    expiresIn: '7d'
  });
}

/**
 * Middleware to verify token from request headers
 */
export function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
}
