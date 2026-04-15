import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PLANS } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { priceId } = await request.json();
        if (!priceId) return NextResponse.json({ error: 'Price ID required' }, { status: 400 });

        await dbConnect();
        const dbUser = await User.findById(user.userId);
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Create or retrieve Stripe customer
        let customerId = dbUser.stripeCustomerId;
        if (!customerId) {
            const customer = await getStripe().customers.create({
                email: dbUser.email,
                name: dbUser.name,
                metadata: { userId: dbUser._id.toString() },
            });
            customerId = customer.id;
            dbUser.stripeCustomerId = customerId;
            await dbUser.save();
        }

        const origin = request.nextUrl.origin;

        const session = await getStripe().checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${origin}/dashboard/billing?success=true`,
            cancel_url: `${origin}/dashboard/billing?canceled=true`,
            metadata: { userId: dbUser._id.toString() },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
