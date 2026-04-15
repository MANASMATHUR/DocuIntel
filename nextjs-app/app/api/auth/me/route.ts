import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let stats = { casesAnalyzed: 0, clausesReviewed: 0, criticalRisksFound: 0, analysesThisMonth: 0 };
    let plan = 'free';
    try {
        await dbConnect();
        const dbUser = await User.findById(user.userId).lean() as any;
        if (dbUser?.stats) stats = dbUser.stats;
        if (dbUser?.plan) plan = dbUser.plan;
    } catch {}

    return NextResponse.json({ user: { ...user, stats, plan } });
}
