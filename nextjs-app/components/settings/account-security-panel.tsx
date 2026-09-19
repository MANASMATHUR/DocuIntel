'use client';

import { useEffect, useState } from 'react';
import { Shield, Mail, KeyRound, Loader2 } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';

interface OAuthConfig {
    providers: string[];
    credentials: boolean;
    demo: boolean;
}

interface LinkedAccount {
    provider: string;
    providerAccountId: string;
}

export function AccountSecurityPanel() {
    const { user } = useUser();
    const [oauthConfig, setOauthConfig] = useState<OAuthConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth/oauth-config')
            .then((r) => r.json())
            .then(setOauthConfig)
            .catch(() => setOauthConfig({ providers: [], credentials: true, demo: false }))
            .finally(() => setLoading(false));
    }, []);

    const linked = (user?.accounts as LinkedAccount[] | undefined) || [];
    const hasGoogle = linked.some((a) => a.provider === 'google');
    const hasApple = linked.some((a) => a.provider === 'apple');
    const hasCredentials = linked.some((a) => a.provider === 'credentials');

    const providerLabel: Record<string, string> = {
        google: 'Google',
        apple: 'Apple',
        credentials: 'Email & password',
    };

    return (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <Shield size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-[var(--text)]">Account & Security</h2>
                    <p className="text-sm text-text-dim">Sign-in methods and account status</p>
                </div>
            </div>

            {user?.memberSince && (
                <p className="text-xs text-text-dim">
                    Member since {new Date(user.memberSince as string).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
            )}

            <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-text-dim">Linked sign-in methods</p>
                {linked.length === 0 ? (
                    <p className="text-sm text-text-dim">Email/password sign-in active</p>
                ) : (
                    linked.map((a) => (
                        <div
                            key={`${a.provider}-${a.providerAccountId}`}
                            className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)]"
                        >
                            {a.provider === 'credentials' ? (
                                <KeyRound size={16} className="text-text-dim" />
                            ) : (
                                <Mail size={16} className="text-text-dim" />
                            )}
                            <span className="text-sm text-[var(--text)]">
                                {providerLabel[a.provider] || a.provider}
                            </span>
                            <span className="ml-auto text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                                Connected
                            </span>
                        </div>
                    ))
                )}
            </div>

            {!loading && oauthConfig && oauthConfig.providers.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                    <p className="text-xs font-medium uppercase tracking-wider text-text-dim">Available to link</p>
                    <div className="flex flex-wrap gap-2">
                        {oauthConfig.providers.includes('google') && !hasGoogle && (
                            <span className="px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-subtle)] border border-[var(--border)]">
                                Google — sign in from login page to link
                            </span>
                        )}
                        {oauthConfig.providers.includes('apple') && !hasApple && (
                            <span className="px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-subtle)] border border-[var(--border)]">
                                Apple — sign in from login page to link
                            </span>
                        )}
                        {hasGoogle && hasApple && hasCredentials && (
                            <span className="text-xs text-text-dim">All available methods linked</span>
                        )}
                    </div>
                </div>
            )}

            {user?.emailVerified && (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <Shield size={12} /> Email verified
                </p>
            )}

            {loading && (
                <div className="flex items-center gap-2 text-text-dim text-sm">
                    <Loader2 size={14} className="animate-spin" /> Loading security info...
                </div>
            )}
        </div>
    );
}
