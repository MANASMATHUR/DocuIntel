import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

const DOCUSIGN_OAUTH_HOST = 'https://account-d.docusign.com/oauth/token';

type DocusignTokenDoc = {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    account_id?: string;
    base_uri?: string;
};

async function getValidDocusignCredentials(
    userId: string,
    token: DocusignTokenDoc
): Promise<{ access_token: string; account_id: string; base_uri: string } | null> {
    if (!token.access_token || !token.account_id || !token.base_uri) return null;

    const bufferMs = 60_000;
    const stale =
        !token.expires_at ||
        Date.now() > token.expires_at - bufferMs;

    if (!stale) {
        return {
            access_token: token.access_token,
            account_id: token.account_id,
            base_uri: token.base_uri,
        };
    }

    if (!token.refresh_token) return null;

    const clientId = process.env.DOCUSIGN_CLIENT_ID;
    const clientSecret = process.env.DOCUSIGN_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch(DOCUSIGN_OAUTH_HOST, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${auth}`,
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: token.refresh_token,
        }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) return null;

    const nextRefresh = tokens.refresh_token || token.refresh_token;
    await User.findByIdAndUpdate(userId, {
        docusignToken: {
            access_token: tokens.access_token,
            refresh_token: nextRefresh,
            expires_at: Date.now() + (tokens.expires_in * 1000),
            account_id: token.account_id,
            base_uri: token.base_uri,
        },
    });

    return {
        access_token: tokens.access_token,
        account_id: token.account_id!,
        base_uri: token.base_uri!,
    };
}

export async function POST(request: NextRequest) {
    const userId = request.headers.get('X-User-Id') || 'anonymous';

    try {
        const { recipientEmail, recipientName, documentTitle, documentContent } = await request.json();

        if (!recipientEmail || !documentContent) {
            return NextResponse.json({ error: 'Recipient email and document content required' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findById(userId).lean() as any;
        if (!user?.docusignToken?.access_token) {
            return NextResponse.json({ error: 'DocuSign not connected. Go to Integrations to connect.' }, { status: 400 });
        }

        const creds = await getValidDocusignCredentials(userId, user.docusignToken);
        if (!creds) {
            return NextResponse.json(
                {
                    error:
                        'DocuSign session expired or could not be renewed. Open Dashboard → Integrations and connect DocuSign again.',
                },
                { status: 401 }
            );
        }

        const { access_token, account_id, base_uri } = creds;
        const docBase64 = Buffer.from(documentContent).toString('base64');

        // Create envelope
        const envelope = {
            emailSubject: `Please sign: ${documentTitle || 'Contract'}`,
            documents: [{
                documentBase64: docBase64,
                name: documentTitle || 'Contract.txt',
                fileExtension: 'txt',
                documentId: '1',
            }],
            recipients: {
                signers: [{
                    email: recipientEmail,
                    name: recipientName || recipientEmail,
                    recipientId: '1',
                    routingOrder: '1',
                    tabs: {
                        signHereTabs: [{
                            documentId: '1',
                            pageNumber: '1',
                            xPosition: '100',
                            yPosition: '700',
                        }],
                    },
                }],
            },
            status: 'sent',
        };

        const res = await fetch(`${base_uri}/restapi/v2.1/accounts/${account_id}/envelopes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify(envelope),
        });

        const data = await res.json();
        if (!res.ok) {
            return NextResponse.json({ error: data.message || 'Failed to send for signature' }, { status: res.status });
        }

        return NextResponse.json({
            success: true,
            envelopeId: data.envelopeId,
            status: data.status,
            message: `Document sent to ${recipientEmail} for signature.`,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
