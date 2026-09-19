import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createToken } from '@/lib/auth';

const COOKIE_NAME = 'docuintel-token';

/** Bridge Auth.js session → docuintel-token cookie for existing middleware/API routes */
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    const token = await createToken({
        userId: session.user.id,
        email: session.user.email || '',
        name: session.user.name || '',
        role: (session.user as { role?: string }).role || 'user',
    });

    const to = request.nextUrl.searchParams.get('to') || '/dashboard';
    const response = NextResponse.redirect(new URL(to, request.url));

    response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
    });

    return response;
}
