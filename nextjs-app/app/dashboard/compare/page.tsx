'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, ArrowRight, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';

interface CaseOption { case_id: string; title: string; date: string; }

export default function ComparePage() {
    const [cases, setCases] = useState<CaseOption[]>([]);
    const [caseIdA, setCaseIdA] = useState('');
    const [caseIdB, setCaseIdB] = useState('');
    const [comparison, setComparison] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [workspaceTab, setWorkspaceTab] = useState('overview');

    useEffect(() => {
        fetch('/api/cases').then(r => r.json()).then(data => {
            setCases((data.cases || []).map((c: any) => ({ case_id: c.case_id, title: c.title, date: c.date })));
        }).catch(() => {});
    }, []);

    const runComparison = async () => {
        if (!caseIdA || !caseIdB || caseIdA === caseIdB) return;
        setLoading(true);
        try {
            const res = await fetch('/api/cases/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caseIdA, caseIdB }),
            });
            const data = await res.json();
            if (res.ok) setComparison(data);
        } catch {}
        finally { setLoading(false); }
    };

    const DeltaBadge = ({ value }: { value: number }) => {
        if (value === 0) return <span className="text-text-dim flex items-center gap-1"><Minus size={12} /> 0</span>;
        if (value > 0) return <span className="text-red-400 flex items-center gap-1"><TrendingUp size={12} /> +{value}</span>;
        return <span className="text-emerald-400 flex items-center gap-1"><TrendingDown size={12} /> {value}</span>;
    };

    return (
        <DashboardLayout activeTab={workspaceTab} onTabChange={setWorkspaceTab}>
            <div className="max-w-[1000px] space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-text mb-1">Compare Cases</h1>
                    <p className="text-sm text-text-dim">Select two analyzed contracts to compare risk profiles side by side.</p>
                </div>

                {/* Selector */}
                <div className="flex items-end gap-4">
                    <div className="flex-1">
                        <label className="text-xs text-text-dim block mb-1.5">Case A</label>
                        <select
                            value={caseIdA}
                            onChange={e => setCaseIdA(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-primary/50"
                        >
                            <option value="">Select a case</option>
                            {cases.map(c => <option key={c.case_id} value={c.case_id}>{c.title}</option>)}
                        </select>
                    </div>
                    <ArrowRight size={20} className="text-text-dim mb-2" />
                    <div className="flex-1">
                        <label className="text-xs text-text-dim block mb-1.5">Case B</label>
                        <select
                            value={caseIdB}
                            onChange={e => setCaseIdB(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-primary/50"
                        >
                            <option value="">Select a case</option>
                            {cases.map(c => <option key={c.case_id} value={c.case_id}>{c.title}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={runComparison}
                        disabled={loading || !caseIdA || !caseIdB || caseIdA === caseIdB}
                        className="px-5 py-2.5 rounded-lg bg-primary text-[var(--text-inverse)] text-sm font-medium disabled:opacity-40 hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <GitCompare size={14} />}
                        Compare
                    </button>
                </div>

                {/* Results */}
                {comparison && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Side-by-side summary */}
                        <div className="grid grid-cols-2 gap-4">
                            {[comparison.caseA, comparison.caseB].map((c: any, i: number) => (
                                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                                    <p className="text-xs text-primary font-medium mb-1">Case {i === 0 ? 'A' : 'B'}</p>
                                    <p className="text-base font-semibold text-[var(--text)] mb-3 truncate">{c.title}</p>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div><span className="text-text-dim">Clauses:</span> <span className="text-[var(--text)] font-mono">{c.clauseCount}</span></div>
                                        <div><span className="text-text-dim">Critical:</span> <span className="text-red-400 font-mono">{c.severityBreakdown.critical}</span></div>
                                        <div><span className="text-text-dim">High:</span> <span className="text-amber-400 font-mono">{c.severityBreakdown.high}</span></div>
                                        <div><span className="text-text-dim">Medium:</span> <span className="text-indigo-400 font-mono">{c.severityBreakdown.medium}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Delta table */}
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                            <p className="text-sm font-semibold text-[var(--text)] mb-4">Risk Delta (B vs A)</p>
                            <div className="grid grid-cols-5 gap-4 text-sm">
                                {(['critical', 'high', 'medium', 'low', 'clauseCount'] as const).map(key => (
                                    <div key={key} className="text-center">
                                        <p className="text-xs text-text-dim mb-1 capitalize">{key === 'clauseCount' ? 'Clauses' : key}</p>
                                        <div className="font-mono text-base"><DeltaBadge value={comparison.delta[key]} /></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top risks comparison */}
                        <div className="grid grid-cols-2 gap-4">
                            {[comparison.caseA, comparison.caseB].map((c: any, i: number) => (
                                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                                    <p className="text-sm font-semibold text-[var(--text)] mb-3">Top Risks - {c.title?.slice(0, 25)}</p>
                                    {c.topRisks.length === 0 ? (
                                        <p className="text-xs text-text-dim">No critical or high risks found.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {c.topRisks.map((r: any, ri: number) => (
                                                <div key={ri} className="flex items-start gap-2 text-xs">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase flex-shrink-0 ${
                                                        r.severity === 'critical' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                                                    }`}>{r.severity}</span>
                                                    <span className="text-text-secondary">{r.rationale?.slice(0, 120)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    );
}
