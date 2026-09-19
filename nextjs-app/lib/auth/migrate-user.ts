import User from '@/lib/db/models/User';

/** Lazy migration: backfill accounts array for legacy email/password users */
export async function ensureUserAccountsMigrated(userId: string) {
    const user = await User.findById(userId);
    if (!user) return;

    if (user.accounts?.length) return;

    user.accounts = [{ provider: 'credentials', providerAccountId: user.email }];
    await user.save();
}
