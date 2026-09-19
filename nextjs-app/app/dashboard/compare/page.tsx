import { redirect } from 'next/navigation';
import { getSessionUser, getCasesForUser } from '@/lib/server/data';
import { CompareClient } from './compare-client';
import type { CaseListItem } from '@/lib/hooks/useCases';

export default async function ComparePage() {
    const user = await getSessionUser();
    if (!user) redirect('/login');

    const rawCases = await getCasesForUser(user.userId);
    const initialCases: CaseListItem[] = rawCases.map((c: Record<string, unknown>) => ({
        case_id: c.case_id as string,
        title: (c.title as string) || 'Untitled',
        status: (c.status as string) || 'completed',
        date: String(c.date || c.createdAt || new Date().toISOString()),
        type: (c.type as string) || 'Contract',
    }));

    return <CompareClient initialCases={initialCases} />;
}
