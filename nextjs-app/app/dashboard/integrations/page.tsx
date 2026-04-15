'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Slack, Webhook, Cloud, FileSignature, Save, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';

export default function IntegrationsPage() {
    const [slackUrl, setSlackUrl] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [docusignConnected, setDocusignConnected] = useState(false);
    const [workspaceTab, setWorkspaceTab] = useState('overview');

    useEffect(() => {
        fetch('/api/integrations').then(r => r.json()).then(data => {
            setSlackUrl(data.slackWebhookUrl || '');
            setWebhookUrl(data.webhookUrl || '');
            setGoogleConnected(data.googleDriveConnected || false);
            setDocusignConnected(data.docusignConnected || false);
        }).catch(() => {});
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/integrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slackWebhookUrl: slackUrl, webhookUrl }),
            });
            setNotice('Integrations saved.');
            setTimeout(() => setNotice(null), 3000);
        } catch {}
        finally { setSaving(false); }
    };

    const connectGoogle = () => {
        window.location.href = '/api/integrations/google/connect';
    };

    const connectDocusign = () => {
        window.location.href = '/api/integrations/docusign/connect';
    };

    return (
        <DashboardLayout activeTab={workspaceTab} onTabChange={setWorkspaceTab}>
            <div className="max-w-[700px] space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-text mb-1">Integrations</h1>
                    <p className="text-sm text-text-dim">Connect external services to automate your workflow.</p>
                </div>

                {notice && (
                    <div className="px-4 py-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
                        <CheckCircle2 size={14} /> {notice}
                    </div>
                )}

                {/* Slack */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#4A154B]/20 flex items-center justify-center">
                            <Slack size={20} className="text-[#E01E5A]" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[var(--text)]">Slack</p>
                            <p className="text-xs text-text-dim">Get notified when analysis completes</p>
                        </div>
                    </div>
                    <input
                        value={slackUrl} onChange={e => setSlackUrl(e.target.value)}
                        placeholder="https://hooks.slack.com/services/T.../B.../xxx"
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-primary/40"
                    />
                    <p className="text-xs text-text-dim mt-2">Create an incoming webhook in your Slack workspace settings.</p>
                </motion.div>

                {/* Webhook (Zapier/n8n) */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                            <Webhook size={20} className="text-accent" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[var(--text)]">Outgoing Webhook</p>
                            <p className="text-xs text-text-dim">Send events to Zapier, n8n, or any endpoint</p>
                        </div>
                    </div>
                    <input
                        value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-primary/40"
                    />
                    <p className="text-xs text-text-dim mt-2">Receives POST with event type, case data, and timestamp on each analysis.</p>
                </motion.div>

                {/* Google Drive */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Cloud size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[var(--text)]">Google Drive</p>
                                <p className="text-xs text-text-dim">Import contracts directly from Drive</p>
                            </div>
                        </div>
                        <button
                            onClick={connectGoogle}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${googleConnected
                                ? 'bg-success/10 text-success border border-success/20'
                                : 'bg-[var(--bg-hover)] text-[var(--text)] hover:bg-[var(--border)] border border-[var(--border)]'
                            }`}
                        >
                            {googleConnected ? <><CheckCircle2 size={14} /> Connected</> : <><ExternalLink size={14} /> Connect</>}
                        </button>
                    </div>
                </motion.div>

                {/* DocuSign */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                <FileSignature size={20} className="text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[var(--text)]">DocuSign</p>
                                <p className="text-xs text-text-dim">Send approved redlines for e-signature</p>
                            </div>
                        </div>
                        <button
                            onClick={connectDocusign}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${docusignConnected
                                ? 'bg-success/10 text-success border border-success/20'
                                : 'bg-[var(--bg-hover)] text-[var(--text)] hover:bg-[var(--border)] border border-[var(--border)]'
                            }`}
                        >
                            {docusignConnected ? <><CheckCircle2 size={14} /> Connected</> : <><ExternalLink size={14} /> Connect</>}
                        </button>
                    </div>
                </motion.div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg bg-primary text-[var(--text-inverse)] text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Integrations
                </button>
            </div>
        </DashboardLayout>
    );
}
