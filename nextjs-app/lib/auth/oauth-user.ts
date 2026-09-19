import User from '@/lib/db/models/User';

interface UpsertOAuthInput {
    email: string;
    name: string;
    provider: string;
    providerAccountId: string;
    image?: string;
    emailVerified?: boolean;
}

export async function upsertOAuthUser(input: UpsertOAuthInput) {
    const { email, name, provider, providerAccountId, image, emailVerified } = input;

    let user = await User.findOne({ email });

    if (user) {
        const hasAccount = user.accounts?.some(
            (a: { provider: string; providerAccountId: string }) =>
                a.provider === provider && a.providerAccountId === providerAccountId
        );
        if (!hasAccount) {
            user.accounts = user.accounts || [];
            user.accounts.push({ provider, providerAccountId });
        }
        if (image && !user.image) user.image = image;
        if (emailVerified && !user.emailVerified) user.emailVerified = new Date();
        if (name && user.name === email.split('@')[0]) user.name = name;
        await user.save();
        return user;
    }

    user = await User.create({
        email,
        name,
        image,
        emailVerified: emailVerified ? new Date() : undefined,
        accounts: [{ provider, providerAccountId }],
    });

    return user;
}

export async function linkCredentialsUser(email: string, userId: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return;

    const hasCreds = user.accounts?.some(
        (a: { provider: string }) => a.provider === 'credentials'
    );
    if (!hasCreds) {
        user.accounts = user.accounts || [];
        user.accounts.push({ provider: 'credentials', providerAccountId: email });
        await user.save();
    }
}
