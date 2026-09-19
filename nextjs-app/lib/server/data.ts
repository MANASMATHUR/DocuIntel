import { getCurrentUser, type UserPayload } from '@/lib/auth';
import dbConnect from '@/lib/db/mongodb';
import Case from '@/lib/db/models/Case';
import ClauseTemplate from '@/lib/db/models/ClauseTemplate';
import Settings from '@/lib/db/models/Settings';
import User from '@/lib/db/models/User';

export async function getSessionUser(): Promise<UserPayload | null> {
    return getCurrentUser();
}

export async function getCasesForUser(userId: string) {
    await dbConnect();
    const cases = await Case.find({ user_id: userId }).sort({ createdAt: -1 }).lean();
    return cases.map((c: Record<string, unknown>) => ({
        ...c,
        date: c.date || c.createdAt || new Date(),
    }));
}

export async function getTemplatesForUser(userId: string) {
    await dbConnect();
    const templates = await ClauseTemplate.find({ user_id: userId }).sort({ createdAt: -1 }).lean();
    return templates;
}

export async function getSettingsForUser(userId: string) {
    await dbConnect();
    const [settings, user] = await Promise.all([
        Settings.findOne({ userId: userId }).lean(),
        User.findById(userId).lean(),
    ]);

    return {
        profile: {
            fullName: user?.name || '',
            email: user?.email || '',
        },
        notifications: settings?.notifications || { email: true, push: false, marketing: false },
        appearance: settings?.appearance || { theme: 'Dark', compactMode: false },
    };
}

export async function getCaseById(userId: string, caseId: string) {
    await dbConnect();
    return Case.findOne({ case_id: caseId, user_id: userId }).lean();
}
