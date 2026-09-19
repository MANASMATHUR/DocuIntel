import { NextRequest, NextResponse } from 'next/server';
import { createOAuthState } from '@/lib/oauth-state';

export async function GET(request: NextRequest) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        return NextResponse.json(
            { error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' },
            { status: 503 }
        );
    }

    const state = await createOAuthState('google-drive');
    const redirectUri = `${request.nextUrl.origin}/api/integrations/google/callback`;
    const scopes = 'https://www.googleapis.com/auth/drive.readonly';

    const url =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${encodeURIComponent(state)}`;

    return NextResponse.redirect(url);
}
