import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { COOKIE_NAME, getCookieClearOptions } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const DEV_SECRET = 'docuintel-dev-secret-change-in-prod';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || process.env.AUTH_SECRET || DEV_SECRET
);

// Routes that require authentication
const PROTECTED_ROUTES = [
    '/api/cases',
    '/api/ai/stream',
    '/api/settings',
    '/api/negotiate',
    '/api/reports',
    '/api/metrics',
    '/api/search',
    '/api/library',
    '/api/integrations',
    '/api/billing',
];

// Routes that are always public
const PUBLIC_ROUTES = ['/api/health', '/api/providers'];

// Pages that require login (redirect to /login if not authenticated)
const PROTECTED_PAGES = ['/dashboard'];

const RATE_LIMITED_AUTH = ['/api/auth/login', '/api/auth/register', '/api/auth/reset-password'];

function resolveCorsOrigin(request: NextRequest): string {
    let allowed = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (process.env.VERCEL_URL && !process.env.NEXT_PUBLIC_APP_URL) {
        allowed = `https://${process.env.VERCEL_URL}`;
    }
    const origin = request.headers.get('origin');
    if (process.env.NODE_ENV !== 'production') {
        if (origin?.startsWith('http://localhost:') || origin?.startsWith('http://127.0.0.1:')) {
            return origin;
        }
    }
    if (origin === allowed) return origin;
    return allowed;
}

/** Strip client-supplied identity headers; only middleware may set these on the forwarded request. */
function buildTrustedRequestHeaders(
    request: NextRequest,
    user: { userId: string; email: string; name: string }
): Headers {
    const headers = new Headers(request.headers);
    headers.delete('x-user-id');
    headers.delete('x-user-email');
    headers.delete('x-user-name');
    headers.set('X-User-Id', user.userId);
    headers.set('X-User-Email', user.email);
    headers.set('X-User-Name', user.name);
    return headers;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const corsOrigin = resolveCorsOrigin(request);

    // CORS preflight
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers: getCORSHeaders(corsOrigin) });
    }

    // Stripe webhook — signature verified in route handler, no JWT
    if (pathname === '/api/billing/webhook') {
        return addCORS(NextResponse.next(), corsOrigin);
    }

    // Rate limit sensitive auth endpoints
    if (RATE_LIMITED_AUTH.some((r) => pathname.startsWith(r))) {
        const ip = getClientIp(request);
        const limit = rateLimit(`auth:${ip}:${pathname}`, 10, 15 * 60 * 1000);
        if (!limit.success) {
            return addCORS(
                NextResponse.json(
                    { error: 'Too many attempts. Please try again later.' },
                    {
                        status: 429,
                        headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) },
                    }
                ),
                corsOrigin
            );
        }
    }

    // Public API routes: always allow
    if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
        return addCORS(NextResponse.next(), corsOrigin);
    }

    // Auth.js + legacy auth routes (JWT checked in route handlers where needed)
    if (pathname.startsWith('/api/auth/')) {
        return addCORS(NextResponse.next(), corsOrigin);
    }

    // Public read-only shared report JSON (token is the secret); POST stays under /api/reports auth
    if (pathname.startsWith('/api/reports/share') && request.method === 'GET') {
        return addCORS(NextResponse.next(), corsOrigin);
    }

    // Get user from cookie
    const token = request.cookies.get(COOKIE_NAME)?.value;
    let user: { userId: string; email: string; name: string; role?: string } | null = null;
    let invalidToken = false;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            user = {
                userId: payload.userId as string,
                email: (payload.email as string) || '',
                name: (payload.name as string) || '',
                role: payload.role as string | undefined,
            };
        } catch {
            invalidToken = true;
        }
    }

    const clearInvalidCookie = (response: NextResponse) => {
        if (invalidToken) {
            response.cookies.set(COOKIE_NAME, '', getCookieClearOptions());
        }
        return response;
    };

    // Protected pages: redirect to login if not authenticated
    if (PROTECTED_PAGES.some((r) => pathname.startsWith(r))) {
        if (!user) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('from', pathname);
            return clearInvalidCookie(NextResponse.redirect(loginUrl));
        }
        return NextResponse.next();
    }

    // Protected API routes: return 401 if not authenticated
    if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
        if (!user) {
            return clearInvalidCookie(
                addCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), corsOrigin)
            );
        }
        const requestHeaders = buildTrustedRequestHeaders(request, user);
        const response = addCORS(NextResponse.next({ request: { headers: requestHeaders } }), corsOrigin);
        return response;
    }

    return addCORS(NextResponse.next(), corsOrigin);
}

function getCORSHeaders(origin: string): HeadersInit {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

function addCORS(response: NextResponse, origin: string): NextResponse {
    Object.entries(getCORSHeaders(origin)).forEach(([k, v]) => response.headers.set(k, v));
    return response;
}

export const config = {
    matcher: ['/api/:path*', '/dashboard/:path*'],
};
