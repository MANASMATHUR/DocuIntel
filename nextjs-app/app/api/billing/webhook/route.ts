import { NextRequest, NextResponse } from 'next/server';
import { getStripe, getPlanByPriceId } from '@/lib/stripe';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event;
    try {
        event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await dbConnect();

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as any;
            const subscription = await getStripe().subscriptions.retrieve(session.subscription) as any;
            const priceId = subscription.items?.data?.[0]?.price?.id;
            const plan = getPlanByPriceId(priceId) || 'pro';

            await User.findOneAndUpdate(
                { stripeCustomerId: session.customer },
                {
                    plan,
                    stripeSubscriptionId: subscription.id,
                    stripePriceId: priceId,
                    stripeCurrentPeriodEnd: new Date((subscription.current_period_end || 0) * 1000),
                }
            );
            break;
        }

        case 'invoice.paid': {
            const invoice = event.data.object as any;
            if (invoice.subscription) {
                const subscription = await getStripe().subscriptions.retrieve(invoice.subscription) as any;
                await User.findOneAndUpdate(
                    { stripeCustomerId: invoice.customer },
                    {
                        stripeCurrentPeriodEnd: new Date((subscription.current_period_end || 0) * 1000),
                        'stats.analysesThisMonth': 0,
                        'stats.monthReset': new Date(),
                    }
                );
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as any;
            await User.findOneAndUpdate(
                { stripeCustomerId: subscription.customer },
                {
                    plan: 'free',
                    stripeSubscriptionId: null,
                    stripePriceId: null,
                    stripeCurrentPeriodEnd: null,
                }
            );
            break;
        }
    }

    return NextResponse.json({ received: true });
}
