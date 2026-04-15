'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Loader2, Zap } from 'lucide-react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get('from') || '/dashboard';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Login failed');
                return;
            }
            window.location.href = from;
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setError('');
        setDemoLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ demo: true }),
            });
            if (!res.ok) {
                setError('Demo login failed');
                return;
            }
            window.location.href = from;
        } catch {
            setError('Something went wrong.');
        } finally {
            setDemoLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-6 h-6 text-[var(--text)]" />
                    </div>
                    <h1 className="text-2xl font-semibold text-text">Welcome back</h1>
                    <p className="text-sm text-text-dim mt-1">Sign in to DocuIntel</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-medium text-text-dim block mb-1.5">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-medium text-text-dim">Password</label>
                            <Link href="/reset-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="Your password"
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-primary text-[var(--text-inverse)] font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                        Sign In
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[var(--border)]" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-bg px-3 text-xs text-text-dim">or</span>
                    </div>
                </div>

                <button
                    onClick={handleDemoLogin}
                    disabled={demoLoading}
                    className="w-full py-2.5 rounded-lg bg-accent/10 border border-accent/20 text-accent font-medium text-sm hover:bg-accent/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {demoLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                    Try Demo (no signup needed)
                </button>

                <p className="text-center text-sm text-text-dim mt-6">
                    No account?{' '}
                    <Link href="/signup" className="text-primary hover:underline">
                        Sign up
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center text-text-dim">Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
