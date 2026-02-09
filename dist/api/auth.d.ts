/**
 * Authentication Service
 * Handles user registration, login, and JWT token management
 */
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
export declare function register(data: any): Promise<AuthResponse>;
/**
 * Login existing user
 */
export declare function login(data: any): Promise<AuthResponse>;
/**
 * Verify JWT token
 */
export declare function verifyToken(token: string): JWTPayload;
/**
 * Generate JWT token
 */
export declare function generateToken(user: any): string;
/**
 * Middleware to verify token from request headers
 */
export declare function authMiddleware(req: any, res: any, next: any): any;
//# sourceMappingURL=auth.d.ts.map