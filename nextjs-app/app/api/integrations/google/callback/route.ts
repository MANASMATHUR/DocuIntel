import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get('code');
    if (!code) return NextResponse.redirect(new URL('/dashboard/integrations?error=no_code', request.url));

    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.redirect(new URL('/login', request.url));

        const redirectUri = `${request.nextUrl.origin}/api/integrations/google/callback`;

        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID || '',
                client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenRes.json();
        if (!tokens.access_token) {
            return NextResponse.redirect(new URL('/dashboard/integrations?error=token_failed', request.url));
        }

        await dbConnect();
        await User.findByIdAndUpdate(user.userId, {
            googleDriveToken: {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: Date.now() + (tokens.expires_in * 1000),
            },
        });

        return NextResponse.redirect(new URL('/dashboard/integrations?google=connected', request.url));
    } catch (error) {
        console.error('Google OAuth error:', error);
        return NextResponse.redirect(new URL('/dashboard/integrations?error=oauth_failed', request.url));
    }
}
