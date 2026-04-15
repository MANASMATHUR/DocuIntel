'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, CreditCard, Loader2, Zap, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { useSearchParams } from 'next/navigation';

const PLANS = [
    {
        key: 'free', name: 'Free', price: 0, period: '',
        features: ['5 analyses per month', 'Basic risk scoring', 'Text export', 'Community support'],
        cta: 'Current Plan',
    },
    {
        key: 'pro', name: 'Pro', price: 29, period: '/month',
        features: ['Unlimited analyses', 'Negotiation simulator', 'Branded PDF export', 'Clause library', 'Case comparison', 'Global search', 'Priority support'],
        cta: 'Upgrade to Pro',
        popular: true,
    },
    {
        key: 'team', name: 'Team', price: 79, period: '/month',
        features: ['Everything in Pro', 'Team collaboration', 'API access', 'Webhooks & integrations', 'DocuSign e-signatures', 'Dedicated support'],
        cta: 'Upgrade to Team',
    },
];

export default function BillingPage() {
    const searchParams = useSearchParams();
    const [currentPlan, setCurrentPlan] = useState('free');
    const [loading, setLoading] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [workspaceTab, setWorkspaceTab] = useState('overview');

    useEffect(() => {
        if (searchParams.get('success')) setNotice('Subscription activated successfully!');
        if (searchParams.get('canceled')) setNotice('Checkout was canceled.');

        fetch('/api/auth/me').then(r => r.json()).then(data => {
            if (data.user?.plan) setCurrentPlan(data.user.plan);
        }).catch(() => {});
    }, [searchParams]);

    const handleCheckout = async (planKey: string) => {
        const plan = PLANS.find(p => p.key === planKey);
        if (!plan || plan.price === 0) return;

        setLoading(planKey);
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: planKey === 'pro' ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch {}
        finally { setLoading(null); }
    };

    const openPortal = async () => {
        setLoading('portal');
        try {
            const res = await fetch('/api/billing/portal', { method: 'POST' });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch {}
        finally { setLoading(null); }
    };

    return (
        <DashboardLayout activeTab={workspaceTab} onTabChange={setWorkspaceTab}>
            <div className="max-w-[900px] space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-text mb-1">Billing</h1>
                        <p className="text-sm text-text-dim">Manage your subscription and billing details.</p>
                    </div>
                    {currentPlan !== 'free' && (
                        <button
                            onClick={openPortal}
                            disabled={loading === 'portal'}
                            className="px-4 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm font-medium text-text-secondary hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2"
                        >
                            {loading === 'portal' ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                            Manage Subscription
                        </button>
                    )}
                </div>

                {notice && (
                    <div className="px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
                        {notice}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PLANS.map(plan => {
                        const isCurrent = currentPlan === plan.key;
                        return (
                            <motion.div
                                key={plan.key}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-xl border p-6 flex flex-col ${plan.popular
                                    ? 'border-primary/40 bg-primary/5'
                                    : 'border-[var(--border)] bg-[var(--bg-card)]'
                                }`}
                            >
                                {plan.popular && (
                                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-1">
                                        <Zap size={12} /> Most Popular
                                    </span>
                                )}
                                <h3 className="text-lg font-semibold text-[var(--text)]">{plan.name}</h3>
                                <div className="mt-2 mb-4">
                                    <span className="text-3xl font-bold text-[var(--text)]">${plan.price}</span>
                                    <span className="text-sm text-text-dim">{plan.period}</span>
                                </div>

                                <ul className="space-y-2 mb-6 flex-1">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                                            <Check size={14} className="text-success mt-0.5 flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => !isCurrent && handleCheckout(plan.key)}
                                    disabled={isCurrent || loading === plan.key}
                                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${isCurrent
                                        ? 'bg-[var(--bg-subtle)] text-text-dim cursor-default'
                                        : plan.popular
                                            ? 'bg-primary text-[var(--text-inverse)] hover:bg-primary-dark'
                                            : 'bg-[var(--bg-hover)] text-[var(--text)] hover:bg-[var(--border)]'
                                    }`}
                                >
                                    {loading === plan.key && <Loader2 size={14} className="animate-spin" />}
                                    {isCurrent ? 'Current Plan' : plan.cta}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
