/**
 * Next.js Middleware for DocuIntel
 * 
 * Handles authentication, CORS, and request logging for API routes.
 * Protected routes require valid JWT tokens.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = [
    '/api/cases',
    '/api/ai/stream',
    '/api/settings',
];

// Routes that are always public
const PUBLIC_ROUTES = [
    '/api/health',
    '/api/providers',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/demo-token',
];

/**
 * Middleware function to handle authentication and CORS
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return handleCORS(request);
    }

    // Skip authentication for public routes
    if (isPublicRoute(pathname)) {
        return addCORSHeaders(NextResponse.next());
    }

    // Check if route requires authentication
    if (isProtectedRoute(pathname)) {
        const authResult = await checkAuthentication(request);
        if (!authResult.success) {
            const isDev = process.env.NODE_ENV === 'development';
            if (isDev) {
                // In development, allow requests but mark as unverified
                console.warn(`[Middleware] Dev mode - allowing unauthenticated access to ${pathname}`);
                const response = addCORSHeaders(NextResponse.next());
                response.headers.set('X-Auth-Status', 'unverified-dev-mode');
                return response;
            }
            // In production, reject unauthorized requests
            return addCORSHeaders(
                NextResponse.json(
                    { error: 'Unauthorized', message: authResult.error },
                    { status: 401 }
                )
            );
        }
    }

    // Log request for monitoring
    logRequest(request);

    return addCORSHeaders(NextResponse.next());
}

/**
 * Checks if a route is protected
 */
function isProtectedRoute(pathname: string): boolean {
    return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Checks if a route is public
 */
function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Validates authentication token
 */
async function checkAuthentication(request: NextRequest): Promise<{ success: boolean; error?: string }> {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
        return { success: false, error: 'No authorization header provided' };
    }

    if (!authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'Invalid authorization format. Use Bearer token.' };
    }

    const token = authHeader.substring(7);

    // Dynamic import to use the updated auth module
    const { validateToken } = await import('./lib/auth');
    return await validateToken(token);
}

/**
 * Handles CORS preflight requests
 */
function handleCORS(request: NextRequest): NextResponse {
    return new NextResponse(null, {
        status: 204,
        headers: getCORSHeaders(),
    });
}

/**
 * Gets CORS headers
 */
function getCORSHeaders(): HeadersInit {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
        'Access-Control-Max-Age': '86400',
    };
}

/**
 * Adds CORS headers to response
 */
function addCORSHeaders(response: NextResponse): NextResponse {
    const headers = getCORSHeaders();
    Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}

/**
 * Logs request for monitoring
 */
function logRequest(request: NextRequest): void {
    const timestamp = new Date().toISOString();
    const method = request.method;
    const pathname = request.nextUrl.pathname;
    const userAgent = request.headers.get('User-Agent') || 'Unknown';

    console.log(`[${timestamp}] ${method} ${pathname} - ${userAgent.substring(0, 50)}`);
}

/**
 * Configure which routes this middleware applies to
 */
export const config = {
    matcher: [
        '/api/:path*',
    ],
};
