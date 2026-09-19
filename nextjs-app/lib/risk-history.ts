export type RiskSnapshot = {
  at: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
};

const MAX = 12;

export async function loadRiskHistory(caseId: string): Promise<RiskSnapshot[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch(`/api/cases?case_id=${encodeURIComponent(caseId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.riskHistory) ? data.riskHistory : [];
  } catch {
    return [];
  }
}

export async function appendRiskSnapshot(
  caseId: string,
  counts: Omit<RiskSnapshot, 'at'>
): Promise<RiskSnapshot[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/cases', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: caseId, appendRiskSnapshot: counts }),
    });
    if (!res.ok) return loadRiskHistory(caseId);
    const data = await res.json();
    return Array.isArray(data.riskHistory) ? data.riskHistory : [];
  } catch {
    return [];
  }
}

export { MAX as RISK_HISTORY_MAX };
