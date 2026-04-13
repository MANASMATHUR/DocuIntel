/**
 * JWT Authentication Module for DocuIntel
 * 
 * Provides secure token-based authentication for API endpoints using established libraries.
 * Supports token generation, validation, and refresh mechanisms.
 * 
 * @module lib/auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'docuintel-default-secret-change-in-production';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);
const TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * User payload structure for JWT tokens
 */
export interface UserPayload {
    userId: string;
    email: string;
    role: 'user' | 'admin' | 'viewer';
    permissions: string[];
}

/**
 * Token pair returned after authentication
 */
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

/**
 * Authentication result structure
 */
export interface AuthResult {
    success: boolean;
    user?: UserPayload;
    error?: string;
}

/**
 * Generates an access token for authenticated users
 */
export async function generateAccessToken(user: UserPayload): Promise<string> {
    return await new SignJWT({ ...user, type: 'access' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(TOKEN_EXPIRY)
        .sign(SECRET_KEY);
}

/**
 * Generates a refresh token for token renewal
 */
export async function generateRefreshToken(userId: string): Promise<string> {
    return await new SignJWT({ userId, type: 'refresh' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_EXPIRY)
        .sign(SECRET_KEY);
}

/**
 * Generates both access and refresh tokens
 */
export async function generateTokenPair(user: UserPayload): Promise<TokenPair> {
    const accessToken = await generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.userId);

    return {
        accessToken,
        refreshToken,
        expiresIn: 24 * 60 * 60 * 1000 // 24 hours
    };
}

/**
 * Validates an access token and extracts user payload
 */
export async function validateToken(token: string): Promise<AuthResult> {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);

        // Check token type
        if (payload.type !== 'access') {
            return { success: false, error: 'Invalid token type' };
        }

        return {
            success: true,
            user: {
                userId: payload.userId as string,
                email: payload.email as string,
                role: payload.role as 'user' | 'admin' | 'viewer',
                permissions: payload.permissions as string[]
            }
        };
    } catch (error) {
        return { success: false, error: 'Token validation failed' };
    }
}

/**
 * Validates a refresh token
 */
export async function validateRefreshToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);

        // Check token type
        if (payload.type !== 'refresh') {
            return { success: false, error: 'Invalid token type' };
        }

        return { success: true, userId: payload.userId as string };
    } catch (error) {
        return { success: false, error: 'Refresh token validation failed' };
    }
}

/**
 * Extracts the Bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

/**
 * Authentication middleware for API routes
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
    const token = extractBearerToken(request);

    if (!token) {
        return { success: false, error: 'No authentication token provided' };
    }

    return await validateToken(token);
}

/**
 * Creates an unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
    return NextResponse.json(
        { error: message, code: 'UNAUTHORIZED' },
        { status: 401 }
    );
}

/**
 * Creates a forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
    return NextResponse.json(
        { error: message, code: 'FORBIDDEN' },
        { status: 403 }
    );
}

/**
 * Checks if user has required permission
 */
export function hasPermission(user: UserPayload, permission: string): boolean {
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission);
}

/**
 * Rate limiting storage (in-memory for demo, use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting check
 */
export function checkRateLimit(
    identifier: string,
    limit: number = 100,
    windowMs: number = 60 * 1000
): boolean {
    const now = Date.now();
    const record = rateLimitStore.get(identifier);

    if (!record || record.resetTime < now) {
        rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (record.count >= limit) {
        return false;
    }

    record.count++;
    return true;
}

/**
 * Demo user for development/testing
 */
export const DEMO_USER: UserPayload = {
    userId: 'demo-user-001',
    email: 'demo@docuintel.ai',
    role: 'user',
    permissions: ['read', 'write', 'analyze']
};

/**
 * Generates demo tokens for development
 */
export async function generateDemoTokens(): Promise<TokenPair> {
    return await generateTokenPair(DEMO_USER);
}
