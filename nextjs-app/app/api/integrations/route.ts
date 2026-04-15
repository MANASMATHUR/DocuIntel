import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

export async function GET(request: NextRequest) {
    const userId = request.headers.get('X-User-Id') || 'anonymous';
    try {
        await dbConnect();
        const user = await User.findById(userId).lean() as any;
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({
            slackWebhookUrl: user.slackWebhookUrl || '',
            webhookUrl: user.webhookUrl || '',
            webhookEvents: user.webhookEvents || ['analysis_complete'],
            googleDriveConnected: !!user.googleDriveToken,
            docusignConnected: !!user.docusignToken,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const userId = request.headers.get('X-User-Id') || 'anonymous';
    try {
        const body = await request.json();
        await dbConnect();

        const update: any = {};
        if (body.slackWebhookUrl !== undefined) update.slackWebhookUrl = body.slackWebhookUrl;
        if (body.webhookUrl !== undefined) update.webhookUrl = body.webhookUrl;
        if (body.webhookEvents !== undefined) update.webhookEvents = body.webhookEvents;

        await User.findByIdAndUpdate(userId, { $set: update });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
