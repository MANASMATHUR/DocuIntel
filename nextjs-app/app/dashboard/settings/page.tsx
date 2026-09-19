import { redirect } from 'next/navigation';
import { getSessionUser, getSettingsForUser } from '@/lib/server/data';
import { SettingsClient } from './settings-client';

export default async function SettingsPage() {
    const user = await getSessionUser();
    if (!user) redirect('/login');

    const initialSettings = await getSettingsForUser(user.userId);

    return <SettingsClient initialSettings={initialSettings} />;
}
