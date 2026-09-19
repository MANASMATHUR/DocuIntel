'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, Clock, Plus, FolderOpen, Download, Archive, ArchiveRestore } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { useCases, computeCaseRisk, type CaseListItem } from '@/lib/hooks/useCases';

interface CasesClientProps {
    initialCases: CaseListItem[];
}

export function CasesClient({ initialCases }: CasesClientProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: cases = initialCases, isLoading } = useCases(initialCases);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('All');
    const [workspaceTab, setWorkspaceTab] = useState('overview');

    const casesWithRisk = cases.map((c) => ({
        ...c,
        date: c.date || new Date().toISOString(),
        risk: computeCaseRisk(c),
    }));

    const filteredCases = casesWithRisk.filter((c) => {
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter =
            filter === 'All' ||
            c.risk === filter ||
            (filter === 'Archived' && c.archived);
        return matchesSearch && matchesFilter;
    });

    const toggleArchive = async (caseId: string, currentlyArchived: boolean) => {
        await fetch('/api/cases', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ case_id: caseId, archived: !currentlyArchived }),
        });
        queryClient.invalidateQueries({ queryKey: ['cases'] });
    };

    const exportCaseMetadata = (item: typeof casesWithRisk[0]) => {
        const payload = {
            case_id: item.case_id,
            title: item.title,
            date: item.date,
            status: item.status,
            type: item.type,
            risk: item.risk || 'Low',
            summary: item.summary || {},
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${item.case_id}-metadata.json`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    };

    const archivedCount = casesWithRisk.filter((c) => c.archived).length;
    const activeCases = filteredCases.filter((c) => !c.archived);
    const archived = filteredCases.filter((c) => c.archived);
    const recentCases = [...activeCases].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 3);

    return (
        <DashboardLayout activeTab={workspaceTab} onTabChange={setWorkspaceTab}>
            <div className="space-y-8 max-w-[1200px]">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-semibold tracking-tight text-[var(--text)] mb-2">Case Center</h1>
                        <p className="text-text-secondary">Manage, reopen, and export your contract analysis cases.</p>
                    </div>
                    <Link href="/dashboard" className="px-6 py-3 bg-white text-bg rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                        <Plus size={16} />
                        New Case
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="glass-card p-6 rounded-xl border border-[var(--border)]">
                        <p className="text-[10px] uppercase tracking-widest text-text-dim mb-2">Total Cases</p>
                        <p className="text-3xl font-bold font-['Outfit']">{cases.length}</p>
                    </div>
                    <div className="glass-card p-6 rounded-xl border border-[var(--border)]">
                        <p className="text-[10px] uppercase tracking-widest text-text-dim mb-2">Active</p>
                        <p className="text-3xl font-bold text-emerald-400 font-['Outfit']">{cases.length - archivedCount}</p>
                    </div>
                    <div className="glass-card p-6 rounded-xl border border-[var(--border)]">
                        <p className="text-[10px] uppercase tracking-widest text-text-dim mb-2">Archived</p>
                        <p className="text-3xl font-bold text-amber-400 font-['Outfit']">{archivedCount}</p>
                    </div>
                </div>

                <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={20} />
                        <input
                            type="text"
                            placeholder="Search cases..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text)] focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                    <div className="relative group">
                        <button className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text)] hover:bg-white/10 transition-colors flex items-center gap-2">
                            <Filter size={20} />
                            {filter} Risk
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-xl overflow-hidden hidden group-hover:block z-10">
                            {['All', 'High', 'Medium', 'Low', 'Archived'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-white/5 hover:text-[var(--text)] transition-colors"
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {recentCases.length > 0 && (
                    <div className="glass-card border border-[var(--border)] rounded-xl p-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-text-dim">Recent Active Cases</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {recentCases.map((c) => (
                                <button
                                    key={c.case_id}
                                    onClick={() => router.push(`/dashboard?case_id=${encodeURIComponent(c.case_id)}`)}
                                    className="text-left p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-primary/30 transition-colors"
                                >
                                    <p className="text-sm font-semibold truncate">{c.title}</p>
                                    <p className="text-xs text-text-dim mt-1">{new Date(c.date).toLocaleDateString()}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center py-12 text-text-dim">Loading cases...</div>
                ) : filteredCases.length === 0 ? (
                    <div className="text-center py-12 text-text-dim">
                        <FileText className="mx-auto h-12 w-12 text-text-dim mb-4" />
                        <p>No cases found</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {[...activeCases, ...archived].map((caseItem, index) => {
                            const isArchived = !!caseItem.archived;
                            return (
                                <motion.div
                                    key={caseItem.case_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`p-4 rounded-xl border transition-all group ${isArchived ? 'bg-[var(--bg-card)] border-amber-500/20' : 'bg-white/5 border-white/10 hover:border-primary/30'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5">
                                                <FileText className="text-primary" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-[var(--text)] group-hover:text-primary transition-colors">
                                                    {caseItem.title}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-text-dim">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {caseItem.date ? new Date(caseItem.date).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        }) : 'N/A'}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{caseItem.type || 'Contract'}</span>
                                                    {isArchived && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-amber-400">Archived</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${caseItem.risk === 'High'
                                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                : caseItem.risk === 'Medium'
                                                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                                                }`}>
                                                {caseItem.risk} Risk
                                            </div>
                                            <button
                                                onClick={() => router.push(`/dashboard?case_id=${encodeURIComponent(caseItem.case_id)}`)}
                                                className="px-3 py-2 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--border)] text-xs uppercase tracking-wider flex items-center gap-2"
                                            >
                                                <FolderOpen size={14} />
                                                Open Case
                                            </button>
                                            <button
                                                onClick={() => exportCaseMetadata(caseItem)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-text-dim hover:text-[var(--text)] transition-colors"
                                                title="Export metadata"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button
                                                onClick={() => toggleArchive(caseItem.case_id, isArchived)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-text-dim hover:text-[var(--text)] transition-colors"
                                                title={isArchived ? 'Restore case' : 'Archive case'}
                                            >
                                                {isArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
