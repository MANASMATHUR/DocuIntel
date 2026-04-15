'use client';

import { useState } from 'react';

interface DiffViewerProps {
    original: string;
    proposed: string;
    rationale: string;
}

export function DiffViewer({ original, proposed, rationale }: DiffViewerProps) {
    const [mode, setMode] = useState<'split' | 'unified'>('split');
    const safeOriginal = typeof original === 'string' ? original : (original ? JSON.stringify(original) : '');
    const safeProposed = typeof proposed === 'string' ? proposed : (proposed ? JSON.stringify(proposed) : '');
    const safeRationale = typeof rationale === 'string' ? rationale : (rationale ? JSON.stringify(rationale) : '');

    return (
        <div>
            <div className="flex items-center justify-between px-5 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="gazette-label">Redline Review</span>
                <div className="flex gap-1">
                    <button onClick={() => setMode('split')} className={`px-2 py-1 text-[10px] font-medium transition-colors ${mode === 'split' ? 'font-bold underline' : ''}`} style={{ color: mode === 'split' ? 'var(--text)' : 'var(--text-dim)' }}>Split</button>
                    <button onClick={() => setMode('unified')} className={`px-2 py-1 text-[10px] font-medium transition-colors ${mode === 'unified' ? 'font-bold underline' : ''}`} style={{ color: mode === 'unified' ? 'var(--text)' : 'var(--text-dim)' }}>Unified</button>
                </div>
            </div>

            <div className="p-5">
                {mode === 'split' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                            <p className="gazette-label mb-1.5" style={{ color: '#9b2226' }}>Original</p>
                            <div className="p-3 border text-sm leading-relaxed font-mono" style={{ borderColor: 'rgba(155,34,38,0.2)', background: 'rgba(155,34,38,0.03)' }}>
                                {safeOriginal}
                            </div>
                        </div>
                        <div>
                            <p className="gazette-label mb-1.5" style={{ color: '#2d6a4f' }}>Suggested</p>
                            <div className="p-3 border text-sm leading-relaxed font-mono" style={{ borderColor: 'rgba(45,106,79,0.2)', background: 'rgba(45,106,79,0.03)' }}>
                                {safeProposed}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="gazette-label mb-1.5">Diff</p>
                        <div className="p-3 border text-sm font-mono leading-relaxed" style={{ borderColor: 'var(--border)' }}>
                            <span className="line-through" style={{ color: '#9b2226', background: 'rgba(155,34,38,0.05)' }}>{safeOriginal}</span>{' '}
                            <span style={{ color: '#2d6a4f', background: 'rgba(45,106,79,0.05)' }}>{safeProposed}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-5 py-3 border-t flex items-start gap-2" style={{ borderColor: 'var(--border)' }}>
                <span className="gazette-label flex-shrink-0 mt-0.5">Rationale:</span>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{safeRationale}</p>
            </div>
        </div>
    );
}
