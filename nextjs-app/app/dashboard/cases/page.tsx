'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, Clock, Plus, FolderOpen, Download, Archive, ArchiveRestore } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/ui/dashboard-layout';

interface Case {
    case_id: string;
    title: string;
    status: string;
    risk?: 'High' | 'Medium' | 'Low';
    date: string;
    type: string;
    summary?: {
        critical?: number;
        high?: number;
        medium?: number;
        low?: number;
    };
}

export default function CasesPage() {
    const router = useRouter();
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('All');
    const [workspaceTab, setWorkspaceTab] = useState('overview');
    const [archivedCases, setArchivedCases] = useState<string[]>([]);

    useEffect(() => {
        fetchCases();
    }, []);

    useEffect(() => {
        const raw = window.localStorage.getItem('archived_cases');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) setArchivedCases(parsed);
            } catch (error) {
                console.error('Failed to parse archived cases from localStorage', error);
            }
        }
    }, []);

    const fetchCases = async () => {
        try {
            const res = await fetch('/api/cases');
            if (!res.ok) {
                console.error('Failed to fetch cases:', res.statusText);
                setCases([]);
                return;
            }
            const data = await res.json();
            if (data.cases && Array.isArray(data.cases)) {
                // Compute risk level from summary for each case
                const casesWithRisk = data.cases.map((c: Case) => {
                    let risk: 'High' | 'Medium' | 'Low' = 'Low';
                    if (c.summary) {
                        const { critical = 0, high = 0, medium = 0 } = c.summary;
                        if (critical > 0 || high > 2) {
                            risk = 'High';
                        } else if (high > 0 || medium > 2) {
                            risk = 'Medium';
                        }
                    }
                    // Ensure date field exists
                    const date = c.date || (c as any).createdAt || new Date().toISOString();
                    return { ...c, date, risk };
                });
                setCases(casesWithRisk);
            } else {
                setCases([]);
            }
        } catch (error) {
            console.error('Failed to fetch cases:', error);
            setCases([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredCases = cases.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'All' || c.risk === filter || (filter === 'Archived' && archivedCases.includes(c.case_id));
        return matchesSearch && matchesFilter;
    });

    const persistArchiveState = (next: string[]) => {
        setArchivedCases(next);
        window.localStorage.setItem('archived_cases', JSON.stringify(next));
    };

    const toggleArchive = (caseId: string) => {
        if (archivedCases.includes(caseId)) {
            persistArchiveState(archivedCases.filter(id => id !== caseId));
        } else {
            persistArchiveState([...archivedCases, caseId]);
        }
    };

    const exportCaseMetadata = (item: Case) => {
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

    const activeCases = filteredCases.filter(c => !archivedCases.includes(c.case_id));
    const archived = filteredCases.filter(c => archivedCases.includes(c.case_id));
    const recentCases = [...activeCases].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 3);

    return (
        <DashboardLayout activeTab={workspaceTab} onTabChange={setWorkspaceTab}>
            <div className="space-y-8 max-w-[1200px]">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">Case Center</h1>
                        <p className="text-text-secondary">Manage, reopen, and export your contract analysis cases.</p>
                    </div>
                    <Link href="/dashboard" className="px-6 py-3 bg-white text-bg rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                        <Plus size={16} />
                        New Case
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="glass-card p-6 rounded-xl border border-white/[0.05]">
                        <p className="text-[10px] uppercase tracking-widest text-text-dim mb-2">Total Cases</p>
                        <p className="text-3xl font-bold font-['Outfit']">{cases.length}</p>
                    </div>
                    <div className="glass-card p-6 rounded-xl border border-white/[0.05]">
                        <p className="text-[10px] uppercase tracking-widest text-text-dim mb-2">Active</p>
                        <p className="text-3xl font-bold text-emerald-400 font-['Outfit']">{cases.length - archivedCases.length}</p>
                    </div>
                    <div className="glass-card p-6 rounded-xl border border-white/[0.05]">
                        <p className="text-[10px] uppercase tracking-widest text-text-dim mb-2">Archived</p>
                        <p className="text-3xl font-bold text-amber-400 font-['Outfit']">{archivedCases.length}</p>
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
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                    <div className="relative group">
                        <button className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                            <Filter size={20} />
                            {filter} Risk
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-xl overflow-hidden hidden group-hover:block z-10">
                            {['All', 'High', 'Medium', 'Low', 'Archived'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {recentCases.length > 0 && (
                    <div className="glass-card border border-white/[0.05] rounded-xl p-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest mb-4 text-text-dim">Recent Active Cases</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {recentCases.map((c) => (
                                <button
                                    key={c.case_id}
                                    onClick={() => router.push(`/dashboard?case_id=${encodeURIComponent(c.case_id)}`)}
                                    className="text-left p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-primary/30 transition-colors"
                                >
                                    <p className="text-sm font-semibold truncate">{c.title}</p>
                                    <p className="text-xs text-text-dim mt-1">{new Date(c.date).toLocaleDateString()}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-text-dim">Loading cases...</div>
                ) : filteredCases.length === 0 ? (
                    <div className="text-center py-12 text-text-dim">
                        <FileText className="mx-auto h-12 w-12 text-text-dim mb-4" />
                        <p>No cases found</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {[...activeCases, ...archived].map((caseItem, index) => {
                            const isArchived = archivedCases.includes(caseItem.case_id);
                            return (
                                <motion.div
                                    key={caseItem.case_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`p-4 rounded-xl border transition-all group ${isArchived ? 'bg-white/[0.02] border-amber-500/20' : 'bg-white/5 border-white/10 hover:border-primary/30'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5">
                                                <FileText className="text-primary" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                                                    {caseItem.title}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-text-dim">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {caseItem.date ? new Date(caseItem.date).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
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
                                                className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-xs uppercase tracking-wider flex items-center gap-2"
                                            >
                                                <FolderOpen size={14} />
                                                Open Case
                                            </button>
                                            <button
                                                onClick={() => exportCaseMetadata(caseItem)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-text-dim hover:text-white transition-colors"
                                                title="Export metadata"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button
                                                onClick={() => toggleArchive(caseItem.case_id)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-text-dim hover:text-white transition-colors"
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
