'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, ShieldAlert, Cpu, Activity, BarChart, RefreshCw, Terminal, Layers, Box, Hash, Database, Search } from 'lucide-react';

export default function PerformanceDashboard() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<any>(null);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/metrics');
            const data = await res.json();
            setMetrics(data);
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !metrics) {
        return (
            <div className="flex flex-col items-center justify-center py-16 opacity-30">
                <RefreshCw className="animate-spin text-[var(--text)] mb-3" size={24} />
                <p className="text-xs text-[var(--text)] font-medium">Loading Metrics</p>
            </div>
        );
    }

    const cards = [
        {
            title: 'Retrieval Accuracy',
            value: metrics?.summary?.retrievalAccuracy || '—',
            desc: 'Semantic search precision',
            icon: Search,
            color: 'text-primary'
        },
        {
            title: 'Avg Latency',
            value: metrics?.summary?.avgLatency || '—',
            desc: 'Per-clause analysis time',
            icon: Activity,
            color: 'text-purple-400'
        },
        {
            title: 'Success Rate',
            value: metrics?.summary?.successRate || '—',
            desc: 'API call success rate',
            icon: ShieldAlert,
            color: 'text-emerald-400'
        },
        {
            title: 'Uptime',
            value: metrics?.summary?.uptime || '—',
            desc: 'Server availability',
            icon: Database,
            color: 'text-accent'
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <Terminal size={18} className="text-primary" />
                    <h2 className="text-lg font-semibold text-[var(--text)]">Performance Analytics</h2>
                </div>
                <button
                    onClick={fetchMetrics}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-all text-xs font-medium text-[var(--text)]"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Refreshing' : 'Refresh'}
                </button>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-card rounded-xl p-5 hover:bg-[var(--bg-card)] transition-colors"
                    >
                        <div className={`w-9 h-9 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center mb-4 border border-[var(--border)]`}>
                            <card.icon className={card.color} size={16} />
                        </div>
                        <div className="text-2xl font-semibold text-[var(--text)] mb-1">{card.value}</div>
                        <div className="text-xs font-medium text-text-dim mb-1">{card.title}</div>
                        <p className="text-xs text-text-secondary opacity-60">{card.desc}</p>
                    </motion.div>
                ))}
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card rounded-xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-semibold text-[var(--text)]">Metrics Overview</h3>
                    </div>

                    {metrics?.report ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                                <p className="text-xs text-text-dim mb-1">Retrieval Accuracy</p>
                                <p className="text-xl font-semibold text-[var(--text)]">{metrics.report.retrievalAccuracy?.average?.toFixed(1) ?? '—'}%</p>
                                <p className="text-[10px] text-text-dim mt-1">{metrics.report.retrievalAccuracy?.count ?? 0} samples</p>
                            </div>
                            <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                                <p className="text-xs text-text-dim mb-1">Avg Response Latency</p>
                                <p className="text-xl font-semibold text-[var(--text)]">{metrics.report.responseLatency?.average?.toFixed(0) ?? '—'}ms</p>
                                <p className="text-[10px] text-text-dim mt-1">min {metrics.report.responseLatency?.min?.toFixed(0) ?? '—'}ms / max {metrics.report.responseLatency?.max?.toFixed(0) ?? '—'}ms</p>
                            </div>
                            <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                                <p className="text-xs text-text-dim mb-1">Success Rate</p>
                                <p className="text-xl font-semibold text-success">{metrics.report.successRate?.average?.toFixed(1) ?? '—'}%</p>
                                <p className="text-[10px] text-text-dim mt-1">{metrics.report.successRate?.count ?? 0} requests</p>
                            </div>
                            <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                                <p className="text-xs text-text-dim mb-1">Hallucination Rate</p>
                                <p className="text-xl font-semibold text-[var(--text)]">{metrics.report.hallucinationRate?.average?.toFixed(1) ?? '—'}%</p>
                                <p className="text-[10px] text-text-dim mt-1">{metrics.report.hallucinationRate?.count ?? 0} checks</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-text-dim text-sm py-8">
                            Run an analysis to collect performance data.
                        </div>
                    )}
                </div>

                <div className="glass-card rounded-xl p-6 space-y-6">
                    <h3 className="text-sm font-semibold text-[var(--text)]">System Info</h3>

                    <div className="space-y-4">
                        {[
                            { label: 'Model', value: metrics?.report?.version || 'gpt-4o-mini' },
                            { label: 'Requests Tracked', value: String(metrics?.report?.successRate?.count ?? 0) },
                            { label: 'Avg Latency', value: `${metrics?.report?.responseLatency?.average?.toFixed(0) ?? '—'}ms` },
                            { label: 'Min Latency', value: `${metrics?.report?.responseLatency?.min?.toFixed(0) ?? '—'}ms` },
                            { label: 'Max Latency', value: `${metrics?.report?.responseLatency?.max?.toFixed(0) ?? '—'}ms` },
                        ].map(item => (
                            <div key={item.label} className="flex justify-between text-xs py-2 border-b border-white/[0.04] last:border-0">
                                <span className="text-text-dim">{item.label}</span>
                                <span className="text-[var(--text)] font-mono">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Box size={12} className="text-text-dim" />
                            <span className="text-xs text-text-dim">Status</span>
                        </div>
                        <span className="text-xs font-mono text-success font-medium">Running</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
