'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    // If token is present, show the "set new password" form
    // Otherwise, show the "enter your email" form
    return token ? <SetNewPassword token={token} /> : <RequestReset />;
}

function RequestReset() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); return; }
            setSent(true);
        } catch {
            setError('Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
                    <CheckCircle2 size={48} className="text-success mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-text mb-2">Check your email</h1>
                    <p className="text-sm text-text-dim mb-6">
                        If an account exists with <strong className="text-text">{email}</strong>, we sent a password reset link. It expires in 1 hour.
                    </p>
                    <Link href="/login" className="text-primary text-sm hover:underline">
                        Back to sign in
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-6 h-6 text-[var(--text)]" />
                    </div>
                    <h1 className="text-2xl font-semibold text-text">Reset your password</h1>
                    <p className="text-sm text-text-dim mt-1">Enter your email and we will send you a reset link.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                    )}
                    <div>
                        <label className="text-xs font-medium text-text-dim block mb-1.5">Email</label>
                        <input
                            type="email" value={email} onChange={e => setEmail(e.target.value)} required
                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-primary/50"
                            placeholder="you@example.com"
                        />
                    </div>
                    <button
                        type="submit" disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-primary text-[var(--text-inverse)] font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Send Reset Link
                    </button>
                </form>

                <p className="text-center text-sm text-text-dim mt-6">
                    <Link href="/login" className="text-primary hover:underline flex items-center justify-center gap-1">
                        <ArrowLeft size={14} /> Back to sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

function SetNewPassword({ token }: { token: string }) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirm) { setError('Passwords do not match.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); return; }
            setDone(true);
        } catch {
            setError('Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
                    <CheckCircle2 size={48} className="text-success mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-text mb-2">Password updated</h1>
                    <p className="text-sm text-text-dim mb-6">Your password has been reset. You can now sign in with your new password.</p>
                    <Link href="/login" className="px-6 py-2.5 rounded-lg bg-primary text-[var(--text-inverse)] font-medium text-sm hover:bg-primary-dark transition-colors inline-block">
                        Sign In
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-6 h-6 text-[var(--text)]" />
                    </div>
                    <h1 className="text-2xl font-semibold text-text">Choose a new password</h1>
                    <p className="text-sm text-text-dim mt-1">Enter your new password below.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                    )}
                    <div>
                        <label className="text-xs font-medium text-text-dim block mb-1.5">New Password</label>
                        <input
                            type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-primary/50"
                            placeholder="At least 6 characters"
                            autoComplete="new-password"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-text-dim block mb-1.5">Confirm Password</label>
                        <input
                            type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-primary/50"
                            placeholder="Type it again"
                            autoComplete="new-password"
                        />
                    </div>
                    <button
                        type="submit" disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-primary text-[var(--text-inverse)] font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Reset Password
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center text-text-dim">Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
