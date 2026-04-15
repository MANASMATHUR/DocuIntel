'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, AlertTriangle, Shield, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { useRouter } from 'next/navigation';

interface SearchResult {
    type: 'case' | 'clause' | 'risk';
    case_id: string;
    case_title?: string;
    title?: string;
    heading?: string;
    clause_id?: string;
    match: string;
    severity?: string;
    date?: string;
}

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [workspaceTab, setWorkspaceTab] = useState('overview');

    const search = useCallback(async (q: string) => {
        if (q.trim().length < 2) { setResults([]); setSearched(false); return; }
        setLoading(true);
        setSearched(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
            const data = await res.json();
            setResults(data.results || []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') search(query);
    };

    const openCase = (caseId: string) => {
        router.push(`/dashboard?case_id=${encodeURIComponent(caseId)}`);
    };

    const sevColor: Record<string, string> = {
        critical: 'bg-red-500/15 text-red-400',
        high: 'bg-amber-500/15 text-amber-400',
        medium: 'bg-indigo-500/15 text-indigo-400',
        low: 'bg-emerald-500/15 text-emerald-400',
    };

    const typeIcon = (type: string) => {
        if (type === 'case') return <FileText size={14} className="text-primary" />;
        if (type === 'risk') return <AlertTriangle size={14} className="text-amber-400" />;
        return <Shield size={14} className="text-text-dim" />;
    };

    return (
        <DashboardLayout activeTab={workspaceTab} onTabChange={setWorkspaceTab}>
            <div className="max-w-[800px] space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-text mb-1">Search</h1>
                    <p className="text-sm text-text-dim">Search across all your cases, clauses, and risk rationales.</p>
                </div>

                {/* Search input */}
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for clauses, risks, or contract terms..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-primary/50 transition-colors"
                        autoFocus
                    />
                    <button
                        onClick={() => search(query)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-primary text-[var(--text-inverse)] text-xs font-medium hover:bg-primary-dark transition-colors"
                    >
                        Search
                    </button>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="text-center py-8 text-text-dim text-sm">Searching...</div>
                ) : searched && results.length === 0 ? (
                    <div className="text-center py-12 text-text-dim">
                        <Search size={28} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No results found</p>
                        <p className="text-xs">Try different search terms or keywords.</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-2">
                        <p className="text-xs text-text-dim">{results.length} result{results.length !== 1 ? 's' : ''}</p>
                        {results.map((r, i) => (
                            <motion.div
                                key={`${r.case_id}-${r.clause_id}-${i}`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.02 }}
                                onClick={() => openCase(r.case_id)}
                                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 cursor-pointer hover:border-primary/20 hover:bg-[var(--bg-subtle)] transition-all group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="mt-0.5">{typeIcon(r.type)}</div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-text-dim uppercase">{r.type}</span>
                                                {r.severity && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-medium ${sevColor[r.severity] || ''}`}>
                                                        {r.severity}
                                                    </span>
                                                )}
                                                <span className="text-xs text-text-dim truncate">{r.case_title || r.title || ''}</span>
                                            </div>
                                            {r.heading && <p className="text-sm font-medium text-[var(--text)] mb-1">{r.heading}</p>}
                                            <p className="text-xs text-text-secondary leading-relaxed">{r.match}</p>
                                        </div>
                                    </div>
                                    <ExternalLink size={14} className="text-text-dim opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : null}
            </div>
        </DashboardLayout>
    );
}
