import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'docuintel-dev-secret-change-in-prod'
);

const COOKIE_NAME = 'docuintel-token';

// Routes that require authentication
const PROTECTED_ROUTES = ['/api/cases', '/api/ai/stream', '/api/settings', '/api/negotiate', '/api/reports', '/api/metrics', '/api/search', '/api/library', '/api/integrations', '/api/billing'];

// Routes that are always public
const PUBLIC_ROUTES = ['/api/health', '/api/providers', '/api/auth/'];

// Pages that require login (redirect to /login if not authenticated)
const PROTECTED_PAGES = ['/dashboard'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // CORS preflight
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers: getCORSHeaders() });
    }

    // Public API routes: always allow
    if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
        return addCORS(NextResponse.next());
    }

    // Get user from cookie
    const token = request.cookies.get(COOKIE_NAME)?.value;
    let user = null;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            user = payload;
        } catch {
            // Token invalid/expired — clear it
        }
    }

    // Protected pages: redirect to login if not authenticated
    if (PROTECTED_PAGES.some(r => pathname.startsWith(r))) {
        if (!user) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('from', pathname);
            return NextResponse.redirect(loginUrl);
        }
        return NextResponse.next();
    }

    // Protected API routes: return 401 if not authenticated
    if (PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
        if (!user) {
            return addCORS(
                NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            );
        }
        // Attach user info to request headers for downstream routes
        const response = addCORS(NextResponse.next());
        response.headers.set('X-User-Id', user.userId as string);
        response.headers.set('X-User-Email', user.email as string);
        response.headers.set('X-User-Name', user.name as string);
        return response;
    }

    return addCORS(NextResponse.next());
}

function getCORSHeaders(): HeadersInit {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

function addCORS(response: NextResponse): NextResponse {
    Object.entries(getCORSHeaders()).forEach(([k, v]) => response.headers.set(k, v));
    return response;
}

export const config = {
    matcher: ['/api/:path*', '/dashboard/:path*'],
};
