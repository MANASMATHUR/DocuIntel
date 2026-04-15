import Stripe from 'stripe';

// Lazy-init to avoid build-time errors when STRIPE_SECRET_KEY is not set
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
        _stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' as any });
    }
    return _stripe;
}

// Keep backward compat
export const stripe = { get instance() { return getStripe(); } };

export const PLANS = {
    free: {
        name: 'Free',
        price: 0,
        analysesPerMonth: 5,
        features: ['5 analyses/month', 'Basic risk scoring', 'Text export'],
    },
    pro: {
        name: 'Pro',
        priceId: process.env.STRIPE_PRO_PRICE_ID || '',
        price: 29,
        analysesPerMonth: -1, // unlimited
        features: ['Unlimited analyses', 'Negotiation simulator', 'PDF export', 'Clause library', 'Priority support'],
    },
    team: {
        name: 'Team',
        priceId: process.env.STRIPE_TEAM_PRICE_ID || '',
        price: 79,
        analysesPerMonth: -1,
        features: ['Everything in Pro', 'Team collaboration', 'API access', 'Custom integrations', 'Dedicated support'],
    },
};

export type PlanKey = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string): PlanKey | null {
    if (priceId === PLANS.pro.priceId) return 'pro';
    if (priceId === PLANS.team.priceId) return 'team';
    return null;
}
