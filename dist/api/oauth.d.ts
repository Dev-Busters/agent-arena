/**
 * OAuth Authentication - Google & Discord
 * Handles OAuth2 flows and user linking
 */
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
export declare function findOrCreateOAuthUser(profile: OAuthProfile): Promise<{
    user: any;
    isNew: boolean;
}>;
/**
 * Generate tokens for OAuth user
 */
export declare function generateOAuthTokens(user: any): {
    token: any;
    refreshToken: any;
};
/**
 * Verify Google OAuth token - Decode JWT without verification (for testing)
 * In production, verify signature with Google's public keys
 */
export declare function verifyGoogleToken(idToken: string): Promise<OAuthProfile | null>;
/**
 * Exchange Discord code for user profile
 */
export declare function exchangeDiscordCode(code: string, redirectUri: string): Promise<OAuthProfile | null>;
//# sourceMappingURL=oauth.d.ts.map