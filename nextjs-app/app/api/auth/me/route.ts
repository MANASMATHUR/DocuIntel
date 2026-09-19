import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { ensureUserAccountsMigrated } from '@/lib/auth/migrate-user';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let stats = { casesAnalyzed: 0, clausesReviewed: 0, criticalRisksFound: 0, analysesThisMonth: 0 };
    let plan = 'free';
    let image: string | undefined;
    let emailVerified: string | undefined;
    let accounts: { provider: string; providerAccountId: string }[] = [];
    let createdAt: string | undefined;

    try {
        await dbConnect();
        await ensureUserAccountsMigrated(user.userId);
        const dbUser = await User.findById(user.userId).lean();
        if (dbUser) {
            if (dbUser.stats) stats = dbUser.stats as typeof stats;
            if (dbUser.plan) plan = dbUser.plan as string;
            if (dbUser.image) image = dbUser.image as string;
            if (dbUser.emailVerified) emailVerified = new Date(dbUser.emailVerified as Date).toISOString();
            if (dbUser.accounts) accounts = dbUser.accounts as typeof accounts;
            if (dbUser.createdAt) createdAt = new Date(dbUser.createdAt as Date).toISOString();
        }
    } catch {
        /* best-effort */
    }

    return NextResponse.json({
        user: {
            ...user,
            stats,
            plan,
            image,
            emailVerified,
            accounts,
            memberSince: createdAt,
        },
    });
}
