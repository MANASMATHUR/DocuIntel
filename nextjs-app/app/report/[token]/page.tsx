'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Printer, Shield } from 'lucide-react';

type SharedPayload = {
  token: string;
  createdAt: string;
  caseData: Record<string, any>;
};

export default function PublicReportPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';
  const [data, setData] = useState<SharedPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`/api/reports/share?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
          setError(res.status === 404 ? 'This report link is invalid or expired.' : 'Could not load report.');
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError('Could not load report.');
      }
    })();
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-8">
        <p className="text-text-secondary">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-8">
        <p className="text-text-dim text-sm uppercase tracking-widest">Loading report…</p>
      </div>
    );
  }

  const c = data.caseData;
  const counts =
    c.reports?.executive_summary?.risk_counts ||
    c.summary || { critical: 0, high: 0, medium: 0, low: 0 };
  const headline = c.reports?.executive_summary?.headline || 'Executive summary';
  const issues: string[] = c.reports?.executive_summary?.top_issues || [];

  return (
    <div className="report-print-root min-h-screen bg-[#f4f4f5] text-[#111]">
      <header className="report-no-print sticky top-0 z-10 border-b border-black/10 bg-white/90 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111] text-white flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#111]">DocuIntel</p>
            <p className="text-[10px] text-neutral-500">Read-only executive report</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111] text-white text-xs font-semibold uppercase tracking-wider"
        >
          <Printer size={14} />
          Print / Save as PDF
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div className="border-b border-black/10 pb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Case</p>
          <h1 className="text-3xl font-semibold tracking-tight">{c.title || 'Contract analysis'}</h1>
          <p className="text-sm text-neutral-600 mt-2 font-mono">ID: {c.case_id || '—'}</p>
          <p className="text-sm text-neutral-600 mt-1">
            Generated {new Date(data.createdAt).toLocaleString()} · Share token {data.token.slice(0, 8)}…
          </p>
        </div>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">Executive summary</h2>
          <p className="text-lg leading-relaxed">{headline}</p>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">Risk snapshot</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Critical', value: counts.critical ?? 0, tone: 'text-rose-700 bg-rose-50 border-rose-200' },
              { label: 'High', value: counts.high ?? 0, tone: 'text-orange-800 bg-orange-50 border-orange-200' },
              { label: 'Medium', value: counts.medium ?? 0, tone: 'text-amber-800 bg-amber-50 border-amber-200' },
              { label: 'Low', value: counts.low ?? 0, tone: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
            ].map((cell) => (
              <div key={cell.label} className={`rounded-xl border p-4 ${cell.tone}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{cell.label}</p>
                <p className="text-3xl font-semibold mt-1">{cell.value}</p>
              </div>
            ))}
          </div>
        </section>

        {issues.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">Top issues</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed">
              {issues.map((issue, i) => (
                <li key={i} className="text-neutral-800">
                  {issue}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">Clause highlights</h2>
          <div className="space-y-4 text-sm">
            {(c.clauses || []).slice(0, 12).map((clause: any, idx: number) => {
              const risk = (c.risks || []).find((r: any) => r.clause_id === clause.clause_id);
              return (
                <div key={clause.clause_id || idx} className="border border-black/10 rounded-xl p-4 bg-white">
                  <p className="text-[10px] font-mono text-neutral-500 mb-1">{clause.clause_id || `Clause ${idx + 1}`}</p>
                  <p className="text-neutral-800 line-clamp-4">{clause.text}</p>
                  {risk && (
                    <p className="text-xs text-neutral-600 mt-2">
                      <span className="font-semibold capitalize">{risk.severity}</span>
                      {risk.rationale ? ` — ${risk.rationale}` : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <footer className="pt-8 border-t border-black/10 text-[10px] text-neutral-500">
          DocuIntel · Confidential draft for discussion only. Not legal advice.
        </footer>
      </main>
    </div>
  );
}
