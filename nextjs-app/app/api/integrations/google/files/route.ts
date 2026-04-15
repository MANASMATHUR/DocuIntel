import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

async function getAccessToken(userId: string): Promise<string | null> {
    await dbConnect();
    const user = await User.findById(userId).lean() as any;
    if (!user?.googleDriveToken?.access_token) return null;

    let accessToken = user.googleDriveToken.access_token;

    // Refresh if expired
    if (Date.now() > user.googleDriveToken.expires_at && user.googleDriveToken.refresh_token) {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                refresh_token: user.googleDriveToken.refresh_token,
                client_id: process.env.GOOGLE_CLIENT_ID || '',
                client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                grant_type: 'refresh_token',
            }),
        });
        const newTokens = await refreshRes.json();
        if (newTokens.access_token) {
            accessToken = newTokens.access_token;
            await User.findByIdAndUpdate(userId, {
                'googleDriveToken.access_token': accessToken,
                'googleDriveToken.expires_at': Date.now() + (newTokens.expires_in * 1000),
            });
        }
    }

    return accessToken;
}

export async function GET(request: NextRequest) {
    const userId = request.headers.get('X-User-Id') || 'anonymous';
    const downloadId = request.nextUrl.searchParams.get('download');

    try {
        const accessToken = await getAccessToken(userId);
        if (!accessToken) {
            return NextResponse.json({ error: 'Google Drive not connected' }, { status: 400 });
        }

        // Download a specific file
        if (downloadId) {
            const res = await fetch(
                `https://www.googleapis.com/drive/v3/files/${downloadId}?alt=media`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!res.ok) {
                return NextResponse.json({ error: 'Failed to download file' }, { status: res.status });
            }
            const blob = await res.blob();
            return new NextResponse(blob, {
                headers: {
                    'Content-Type': blob.type || 'application/octet-stream',
                },
            });
        }

        // List PDF, DOCX, TXT files
        const query = "mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='text/plain'";
        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,size)&orderBy=modifiedTime desc&pageSize=20`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const data = await res.json();

        return NextResponse.json({ files: data.files || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
