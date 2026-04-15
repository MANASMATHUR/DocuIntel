import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

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

        const { access_token, account_id, base_uri } = user.docusignToken;
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
