'use client';

import type { RiskSnapshot } from '@/lib/risk-history';

type Props = {
  history: RiskSnapshot[];
};

export function RiskTrendSnapshot({ history }: Props) {
  if (history.length < 2) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <p className="text-xs font-medium text-text-dim mb-1">Risk Trend</p>
        <p className="text-sm text-text-secondary">
          Run another analysis on this case to see how risk counts change over time.
        </p>
      </div>
    );
  }

  const current = history[0];
  const previous = history[1];
  const delta = (k: keyof Omit<RiskSnapshot, 'at'>) => current[k] - previous[k];

  const rows: { label: string; key: keyof Omit<RiskSnapshot, 'at'>; color: string }[] = [
    { label: 'Critical', key: 'critical', color: 'bg-red-500' },
    { label: 'High', key: 'high', color: 'bg-amber-400' },
    { label: 'Medium', key: 'medium', color: 'bg-indigo-400' },
    { label: 'Low', key: 'low', color: 'bg-emerald-500' },
  ];

  const totals = history.slice(0, 10).map((h) => h.critical + h.high + h.medium + h.low);
  const maxTotal = Math.max(1, ...totals);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-dim">Risk Trend</p>
        <span className="text-[10px] font-mono text-text-dim">Last {Math.min(history.length, 10)} runs</span>
      </div>

      <div className="flex items-end gap-1 h-16">
        {history
          .slice(0, 10)
          .reverse()
          .map((h, i) => {
            const total = h.critical + h.high + h.medium + h.low;
            const pct = (total / maxTotal) * 100;
            return (
              <div key={`${h.at}-${i}`} className="flex-1 flex flex-col justify-end group">
                <div
                  className="w-full rounded-t-sm bg-primary/40 group-hover:bg-primary/70 transition-colors"
                  style={{ height: `${Math.max(8, pct)}%` }}
                  title={`${new Date(h.at).toLocaleDateString()}: ${total} issues`}
                />
              </div>
            );
          })}
      </div>

      <div className="space-y-1.5">
        {rows.map((r) => {
          const d = delta(r.key);
          return (
            <div key={r.key} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-text-dim">
                <span className={`w-2 h-2 rounded-full ${r.color}`} />
                {r.label}
              </span>
              <span className="font-mono text-[var(--text)]">
                {current[r.key]}
                {d !== 0 && (
                  <span className={d > 0 ? ' text-red-400 ml-1' : ' text-emerald-400 ml-1'}>
                    ({d > 0 ? '+' : ''}{d})
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
