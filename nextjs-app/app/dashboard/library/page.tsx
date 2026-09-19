import { redirect } from 'next/navigation';
import { getSessionUser, getTemplatesForUser } from '@/lib/server/data';
import { LibraryClient, type Template } from './library-client';

export default async function LibraryPage() {
    const user = await getSessionUser();
    if (!user) redirect('/login');

    const raw = await getTemplatesForUser(user.userId);
    const initialTemplates: Template[] = raw.map((t: Record<string, unknown>) => ({
        _id: String(t._id),
        name: (t.name as string) || '',
        category: (t.category as string) || 'General',
        text: (t.text as string) || '',
        source_heading: t.source_heading as string | undefined,
        tags: (t.tags as string[]) || [],
        createdAt: String(t.createdAt || new Date().toISOString()),
    }));

    return <LibraryClient initialTemplates={initialTemplates} />;
}
