import { redirect } from 'next/navigation';
import { getSessionUser, getCasesForUser } from '@/lib/server/data';
import { CasesClient } from './cases-client';
import type { CaseListItem } from '@/lib/hooks/useCases';

export default async function CasesPage() {
    const user = await getSessionUser();
    if (!user) redirect('/login');

    const rawCases = await getCasesForUser(user.userId);
    const initialCases: CaseListItem[] = rawCases.map((c: Record<string, unknown>) => ({
        case_id: c.case_id as string,
        title: (c.title as string) || 'Untitled',
        status: (c.status as string) || 'completed',
        date: String(c.date || c.createdAt || new Date().toISOString()),
        type: (c.type as string) || 'Contract',
        archived: !!c.archived,
        starred: !!c.starred,
        summary: c.summary as CaseListItem['summary'],
    }));

    return <CasesClient initialCases={initialCases} />;
}
