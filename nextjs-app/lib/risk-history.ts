export type RiskSnapshot = {
  at: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
};

const MAX = 12;

function key(caseId: string) {
  return `risk_hist_${caseId}`;
}

export function loadRiskHistory(caseId: string): RiskSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key(caseId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendRiskSnapshot(caseId: string, counts: Omit<RiskSnapshot, 'at'>): RiskSnapshot[] {
  if (typeof window === 'undefined') return [];
  const prev = loadRiskHistory(caseId);
  const next: RiskSnapshot = {
    at: new Date().toISOString(),
    ...counts,
  };
  const last = prev[0];
  if (
    last &&
    last.critical === next.critical &&
    last.high === next.high &&
    last.medium === next.medium &&
    last.low === next.low
  ) {
    return prev;
  }
  const merged = [next, ...prev].slice(0, MAX);
  window.localStorage.setItem(key(caseId), JSON.stringify(merged));
  return merged;
}
