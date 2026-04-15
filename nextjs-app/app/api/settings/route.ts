import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Settings from '@/lib/db/models/Settings';

const DEFAULT_SETTINGS = {
    notifications: { email: true, push: false, marketing: false },
    appearance: { theme: 'Dark', compactMode: false },
};

export async function GET(request: NextRequest) {
    const userId = request.headers.get('X-User-Id') || 'anonymous';
    const userName = request.headers.get('X-User-Name') || '';
    const userEmail = request.headers.get('X-User-Email') || '';

    try {
        await dbConnect();
        let settings = await Settings.findOne({ userId });

        if (!settings) {
            settings = await Settings.create({
                userId,
                profile: { fullName: userName, email: userEmail },
                ...DEFAULT_SETTINGS,
            });
        }

        const obj = settings.toObject();
        return NextResponse.json({
            profile: obj.profile || {},
            notifications: obj.notifications || {},
            appearance: obj.appearance || {},
        });
    } catch (error: any) {
        return NextResponse.json({
            profile: { fullName: userName, email: userEmail },
            ...DEFAULT_SETTINGS,
        });
    }
}

export async function POST(request: NextRequest) {
    const userId = request.headers.get('X-User-Id') || 'anonymous';

    try {
        await dbConnect();
        const body = await request.json();

        const settings = await Settings.findOneAndUpdate(
            { userId },
            {
                $set: {
                    profile: body.profile,
                    notifications: body.notifications,
                    appearance: body.appearance,
                }
            },
            { new: true, upsert: true }
        );

        const obj = settings.toObject();
        return NextResponse.json({
            profile: obj.profile || {},
            notifications: obj.notifications || {},
            appearance: obj.appearance || {},
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
