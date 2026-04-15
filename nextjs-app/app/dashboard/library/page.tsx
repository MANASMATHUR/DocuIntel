'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Trash2, Copy, Tag, Search, X } from 'lucide-react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';

interface Template {
    _id: string;
    name: string;
    category: string;
    text: string;
    source_heading?: string;
    tags: string[];
    createdAt: string;
}

export default function LibraryPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState('General');
    const [newText, setNewText] = useState('');
    const [newTags, setNewTags] = useState('');
    const [workspaceTab, setWorkspaceTab] = useState('overview');
    const [copied, setCopied] = useState<string | null>(null);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/library');
            const data = await res.json();
            setTemplates(data.templates || []);
        } catch {} finally { setLoading(false); }
    };

    useEffect(() => { fetchTemplates(); }, []);

    const addTemplate = async () => {
        if (!newName.trim() || !newText.trim()) return;
        await fetch('/api/library', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newName, category: newCategory, text: newText,
                tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
            }),
        });
        setNewName(''); setNewText(''); setNewTags(''); setShowAdd(false);
        fetchTemplates();
    };

    const deleteTemplate = async (id: string) => {
        await fetch('/api/library', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        fetchTemplates();
    };

    const copyText = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const categories = ['All', ...Array.from(new Set(templates.map(t => t.category)))];
    const [filterCat, setFilterCat] = useState('All');

    const filtered = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.text.toLowerCase().includes(search.toLowerCase()) ||
            t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
        const matchesCat = filterCat === 'All' || t.category === filterCat;
        return matchesSearch && matchesCat;
    });

    return (
        <DashboardLayout activeTab={workspaceTab} onTabChange={setWorkspaceTab}>
            <div className="max-w-[1000px] space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-text mb-1">Clause Library</h1>
                        <p className="text-sm text-text-dim">Save approved clause templates from past analyses for reuse.</p>
                    </div>
                    <button
                        onClick={() => setShowAdd(!showAdd)}
                        className="px-4 py-2 rounded-lg bg-primary text-[var(--text-inverse)] text-sm font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                        {showAdd ? <X size={14} /> : <Plus size={14} />}
                        {showAdd ? 'Cancel' : 'Add Template'}
                    </button>
                </div>

                {/* Add form */}
                <AnimatePresence>
                    {showAdd && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3 overflow-hidden"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    value={newName} onChange={e => setNewName(e.target.value)}
                                    placeholder="Template name"
                                    className="px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-primary/50"
                                />
                                <select
                                    value={newCategory} onChange={e => setNewCategory(e.target.value)}
                                    className="px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none"
                                >
                                    {['General', 'Liability', 'Indemnification', 'Termination', 'Privacy', 'IP', 'Payment', 'Confidentiality'].map(c =>
                                        <option key={c} value={c}>{c}</option>
                                    )}
                                </select>
                            </div>
                            <textarea
                                value={newText} onChange={e => setNewText(e.target.value)}
                                rows={4} placeholder="Clause text..."
                                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none resize-none"
                            />
                            <div className="flex items-center gap-3">
                                <input
                                    value={newTags} onChange={e => setNewTags(e.target.value)}
                                    placeholder="Tags (comma separated)"
                                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none"
                                />
                                <button onClick={addTemplate} className="px-4 py-2 rounded-lg bg-primary text-[var(--text-inverse)] text-sm font-medium">
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filters */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search templates..."
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-primary/40"
                        />
                    </div>
                    <div className="flex gap-1">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCat(cat)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filterCat === cat ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-[var(--bg-subtle)] text-text-dim border border-[var(--border)] hover:text-[var(--text)]'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Templates list */}
                {loading ? (
                    <div className="text-center py-12 text-text-dim text-sm">Loading templates...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-text-dim">
                        <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No templates yet</p>
                        <p className="text-xs">Save clauses from your analyses or create new templates.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(t => (
                            <motion.div
                                key={t._id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 group"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--text)]">{t.name}</p>
                                        <p className="text-xs text-text-dim">{t.category} {t.source_heading ? `from ${t.source_heading}` : ''}</p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => copyText(t._id, t.text)}
                                            className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-text-dim hover:text-primary transition-colors"
                                            title="Copy clause text"
                                        >
                                            <Copy size={14} />
                                        </button>
                                        <button
                                            onClick={() => deleteTemplate(t._id)}
                                            className="p-1.5 rounded-md hover:bg-red-500/10 text-text-dim hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed mb-3 line-clamp-3">{t.text}</p>
                                {t.tags.length > 0 && (
                                    <div className="flex gap-1.5 flex-wrap">
                                        {t.tags.map((tag, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[10px] text-text-dim flex items-center gap-1">
                                                <Tag size={9} /> {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {copied === t._id && <p className="text-xs text-primary mt-2">Copied to clipboard</p>}
                            </motion.div>
                        ))}
                    </div>
                )}

                <p className="text-xs text-text-dim">{templates.length} template{templates.length !== 1 ? 's' : ''} saved</p>
            </div>
        </DashboardLayout>
    );
}
