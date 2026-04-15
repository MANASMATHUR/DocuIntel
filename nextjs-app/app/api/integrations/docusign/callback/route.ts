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

        const redirectUri = `${request.nextUrl.origin}/api/integrations/docusign/callback`;
        const auth = Buffer.from(`${process.env.DOCUSIGN_CLIENT_ID}:${process.env.DOCUSIGN_CLIENT_SECRET}`).toString('base64');

        const tokenRes = await fetch('https://account-d.docusign.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${auth}`,
            },
            body: new URLSearchParams({
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        });

        const tokens = await tokenRes.json();
        if (!tokens.access_token) {
            return NextResponse.redirect(new URL('/dashboard/integrations?error=token_failed', request.url));
        }

        // Get account info
        const userInfoRes = await fetch('https://account-d.docusign.com/oauth/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userInfo = await userInfoRes.json();
        const account = userInfo.accounts?.[0];

        await dbConnect();
        await User.findByIdAndUpdate(user.userId, {
            docusignToken: {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: Date.now() + (tokens.expires_in * 1000),
                account_id: account?.account_id,
                base_uri: account?.base_uri,
            },
        });

        return NextResponse.redirect(new URL('/dashboard/integrations?docusign=connected', request.url));
    } catch (error) {
        console.error('DocuSign OAuth error:', error);
        return NextResponse.redirect(new URL('/dashboard/integrations?error=oauth_failed', request.url));
    }
}
