import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const dbUser = await User.findById(user.userId);
        if (!dbUser?.stripeCustomerId) {
            return NextResponse.json({ error: 'No billing account found' }, { status: 400 });
        }

        const session = await getStripe().billingPortal.sessions.create({
            customer: dbUser.stripeCustomerId,
            return_url: `${request.nextUrl.origin}/dashboard/billing`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
