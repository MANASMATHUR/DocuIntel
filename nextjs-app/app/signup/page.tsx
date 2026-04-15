'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Loader2 } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Registration failed');
                return;
            }
            router.push('/dashboard');
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
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
                    <h1 className="text-2xl font-semibold text-text">Create an account</h1>
                    <p className="text-sm text-text-dim mt-1">Get started with DocuIntel</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    {error && (
                        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-medium text-text-dim block mb-1.5">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="Your name"
                        />
                    </div>

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
                        <label className="text-xs font-medium text-text-dim block mb-1.5">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="At least 6 characters"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-primary text-[var(--text-inverse)] font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                        Create Account
                    </button>
                </form>

                <p className="text-center text-sm text-text-dim mt-6">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
