'use client';

import { useEffect, useState, ReactNode } from 'react';
import { OAuthButtons } from './oauth-buttons';

interface OAuthSectionProps {
    callbackUrl?: string;
    mode?: 'login' | 'signup';
    dividerLabel?: string;
}

export function OAuthSection({ callbackUrl, mode, dividerLabel = 'or continue with email' }: OAuthSectionProps) {
    const [hasOAuth, setHasOAuth] = useState<boolean | null>(null);

    useEffect(() => {
        fetch('/api/auth/oauth-config')
            .then((r) => r.json())
            .then((data) => setHasOAuth((data.providers?.length ?? 0) > 0))
            .catch(() => setHasOAuth(false));
    }, []);

    if (hasOAuth === null) return null;
    if (!hasOAuth) return null;

    return (
        <>
            <OAuthButtons callbackUrl={callbackUrl} mode={mode} />
            <Divider label={dividerLabel} />
        </>
    );
}

function Divider({ label }: { label: string }) {
    return (
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center">
                <span className="bg-bg px-3 text-xs text-text-dim">{label}</span>
            </div>
        </div>
    );
}

export function OAuthDivider({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
