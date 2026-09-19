'use client';

import { useQuery } from '@tanstack/react-query';

export interface CaseListItem {
    case_id: string;
    title: string;
    status: string;
    date: string;
    type: string;
    archived?: boolean;
    starred?: boolean;
    summary?: {
        critical?: number;
        high?: number;
        medium?: number;
        low?: number;
    };
}

async function fetchCases(): Promise<CaseListItem[]> {
    const res = await fetch('/api/cases');
    if (!res.ok) return [];
    const data = await res.json();
    return data.cases || [];
}

export function useCases(initialData?: CaseListItem[]) {
    return useQuery({
        queryKey: ['cases'],
        queryFn: fetchCases,
        initialData,
    });
}

export function computeCaseRisk(c: CaseListItem): 'High' | 'Medium' | 'Low' {
    if (!c.summary) return 'Low';
    const { critical = 0, high = 0, medium = 0 } = c.summary;
    if (critical > 0 || high > 2) return 'High';
    if (high > 0 || medium > 2) return 'Medium';
    return 'Low';
}
