'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, User, Monitor, Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { AccountSecurityPanel } from '@/components/settings/account-security-panel';

export type SettingsState = {
    profile: { fullName: string; email: string };
    notifications: { email: boolean; push: boolean; marketing: boolean };
    appearance: { theme: string; compactMode: boolean };
};

interface SettingsClientProps {
    initialSettings: SettingsState;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
    const [saving, setSaving] = useState(false);
    const [workspaceTab, setWorkspaceTab] = useState('overview');
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [settings, setSettings] = useState<SettingsState>(initialSettings);

    useEffect(() => {
        if (settings.appearance.compactMode) {
            document.body.classList.add('density-compact');
        } else {
            document.body.classList.remove('density-compact');
        }
    }, [settings.appearance.compactMode]);

    useEffect(() => {
        const html = document.documentElement;
        html.classList.remove('theme-dark');
        if (settings.appearance.theme === 'Dark') {
            html.classList.add('theme-dark');
        } else if (settings.appearance.theme === 'System') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) html.classList.add('theme-dark');
        }
    }, [settings.appearance.theme]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save settings');
            }
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setNotice({ type: 'success', text: 'Settings saved successfully.' });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to save settings.';
            setNotice({ type: 'error', text: message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout activeTab={workspaceTab} onTabChange={setWorkspaceTab}>
            <div className="space-y-8 max-w-[1000px]">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-semibold tracking-tight text-[var(--text)] mb-2">Settings</h1>
                        <p className="text-text-secondary">Manage your account preferences and application settings.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-primary hover:bg-primary-dark text-[var(--text)] rounded-lg font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Save Changes
                    </button>
                </div>
                {notice && (
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${notice.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}`}>
                        {notice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                        <span className="text-sm">{notice.text}</span>
                    </div>
                )}

                <div className="grid gap-6">
                    <AccountSecurityPanel />

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-lg bg-primary/10 text-primary"><User size={24} /></div>
                            <div>
                                <h2 className="text-xl font-semibold text-[var(--text)]">Profile Information</h2>
                                <p className="text-sm text-text-dim">Update your personal details</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Full Name</label>
                                <input
                                    type="text"
                                    value={settings.profile.fullName}
                                    onChange={(e) => setSettings({ ...settings, profile: { ...settings.profile, fullName: e.target.value } })}
                                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-subtle)] border border-white/10 text-[var(--text)] focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Email Address</label>
                                <input
                                    type="email"
                                    value={settings.profile.email}
                                    onChange={(e) => setSettings({ ...settings, profile: { ...settings.profile, email: e.target.value } })}
                                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-subtle)] border border-white/10 text-[var(--text)] focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-lg bg-accent/10 text-accent"><Bell size={24} /></div>
                            <div>
                                <h2 className="text-xl font-semibold text-[var(--text)]">Notifications</h2>
                                <p className="text-sm text-text-dim">Configure how you receive alerts</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-subtle)]">
                            <div>
                                <p className="font-medium text-[var(--text)]">Email Notifications</p>
                                <p className="text-sm text-text-dim">Receive updates about your cases via email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.notifications.email}
                                    onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, email: e.target.checked } })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                            </label>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-lg bg-success/10 text-success"><Monitor size={24} /></div>
                            <div>
                                <h2 className="text-xl font-semibold text-[var(--text)]">Appearance</h2>
                                <p className="text-sm text-text-dim">Customize the interface and workspace density</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {['Dark', 'Light', 'System'].map((theme) => (
                                <button
                                    key={theme}
                                    onClick={() => setSettings({ ...settings, appearance: { ...settings.appearance, theme } })}
                                    className={`p-4 rounded-lg border ${settings.appearance.theme === theme ? 'bg-primary/10 border-primary/50 text-primary' : 'bg-[var(--bg-subtle)] border-white/10 text-text-dim hover:bg-white/5'} transition-all`}
                                >
                                    {theme}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
}
