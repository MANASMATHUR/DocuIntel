import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const clientId = process.env.DOCUSIGN_CLIENT_ID;
    if (!clientId) {
        return NextResponse.json({ error: 'DocuSign not configured. Set DOCUSIGN_CLIENT_ID and DOCUSIGN_CLIENT_SECRET.' }, { status: 503 });
    }

    const redirectUri = `${request.nextUrl.origin}/api/integrations/docusign/callback`;
    const scopes = 'signature';

    const url = `https://account-d.docusign.com/oauth/auth?` +
        `response_type=code&` +
        `scope=${scopes}&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}`;

    return NextResponse.redirect(url);
}
