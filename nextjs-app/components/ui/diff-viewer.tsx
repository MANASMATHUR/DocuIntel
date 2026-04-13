'use client';

import { useState } from 'react';
import { FileCode, Sparkles } from 'lucide-react';

interface DiffViewerProps {
    original: string;
    proposed: string;
    rationale: string;
}

export function DiffViewer({ original, proposed, rationale }: DiffViewerProps) {
    const [mode, setMode] = useState<'side-by-side' | 'unified'>('side-by-side');
    const safeOriginal = typeof original === 'string' ? original : (original ? JSON.stringify(original) : '');
    const safeProposed = typeof proposed === 'string' ? proposed : (proposed ? JSON.stringify(proposed) : '');
    const safeRationale = typeof rationale === 'string' ? rationale : (rationale ? JSON.stringify(rationale) : '');

    return (
        <div>
            {/* Toolbar */}
            <div className="px-5 py-2.5 border-b border-white/[0.05] flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-text-secondary">Redline</span>
                </div>
                <div className="flex bg-white/[0.04] p-0.5 rounded-md border border-white/[0.06]">
                    <button
                        onClick={() => setMode('side-by-side')}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all ${mode === 'side-by-side' ? 'bg-white text-bg' : 'text-text-dim hover:text-white'}`}
                    >
                        Split
                    </button>
                    <button
                        onClick={() => setMode('unified')}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all ${mode === 'unified' ? 'bg-white text-bg' : 'text-text-dim hover:text-white'}`}
                    >
                        Unified
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                {mode === 'side-by-side' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                            <span className="text-[11px] font-medium text-red-400/80 uppercase mb-1.5 block">Original</span>
                            <div className="p-3.5 bg-red-500/[0.04] border border-red-500/10 rounded-lg text-sm text-text-secondary font-mono leading-relaxed min-h-[80px]">
                                {safeOriginal}
                            </div>
                        </div>
                        <div>
                            <span className="text-[11px] font-medium text-emerald-400/80 uppercase mb-1.5 block">Suggested</span>
                            <div className="p-3.5 bg-emerald-500/[0.04] border border-emerald-500/10 rounded-lg text-sm text-white font-mono leading-relaxed min-h-[80px]">
                                {safeProposed}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <span className="text-[11px] font-medium text-primary/80 uppercase mb-1.5 block">Diff</span>
                        <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm font-mono leading-relaxed text-text-secondary">
                            <span className="bg-red-500/[0.06] px-1 py-0.5 rounded border border-red-500/10 line-through text-red-400/60">{safeOriginal}</span>
                            <span className="bg-emerald-500/[0.06] px-1 py-0.5 rounded border border-emerald-500/10 text-emerald-400 ml-2">{safeProposed}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Rationale */}
            <div className="px-5 py-3 border-t border-white/[0.05] flex items-start gap-2.5">
                <Sparkles size={13} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                    <span className="text-[11px] font-medium text-text-dim block mb-0.5">Rationale</span>
                    <p className="text-sm text-text-secondary leading-relaxed">{safeRationale}</p>
                </div>
            </div>
        </div>
    );
}
