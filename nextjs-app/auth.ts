import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { upsertOAuthUser, linkCredentialsUser } from '@/lib/auth/oauth-user';

const DEV_SECRET = 'docuintel-dev-secret-change-in-prod';

function getAuthSecret(): string {
    const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || DEV_SECRET;
    if (
        process.env.NODE_ENV === 'production' &&
        (!secret || secret === DEV_SECRET)
    ) {
        throw new Error('AUTH_SECRET or JWT_SECRET must be set in production');
    }
    return secret;
}

const applePrivateKey = process.env.AUTH_APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const appleConfigured =
    process.env.AUTH_APPLE_ID &&
    process.env.AUTH_APPLE_TEAM_ID &&
    process.env.AUTH_APPLE_KEY_ID &&
    applePrivateKey;

export const { handlers, signIn, signOut, auth } = NextAuth({
    trustHost: true,
    secret: getAuthSecret(),
    pages: {
        signIn: '/login',
        error: '/login',
    },
    providers: [
        ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
            ? [
                  Google({
                      clientId: process.env.AUTH_GOOGLE_ID,
                      clientSecret: process.env.AUTH_GOOGLE_SECRET,
                  }),
              ]
            : []),
        ...(appleConfigured
            ? [
                  Apple({
                      clientId: process.env.AUTH_APPLE_ID!,
                      clientSecret: {
                          appleId: process.env.AUTH_APPLE_ID!,
                          teamId: process.env.AUTH_APPLE_TEAM_ID!,
                          privateKey: applePrivateKey!,
                          keyId: process.env.AUTH_APPLE_KEY_ID!,
                      // Auth.js accepts Apple key object at runtime; package types expect string
                      } as unknown as string,
                  }),
              ]
            : []),
        Credentials({
            id: 'credentials',
            name: 'Email and Password',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const email = credentials?.email?.toString().toLowerCase().trim();
                const password = credentials?.password?.toString();
                if (!email || !password) return null;

                await dbConnect();
                const user = await User.findOne({ email });
                if (!user?.password) return null;

                const valid = await bcrypt.compare(password, user.password);
                if (!valid) return null;

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    image: user.image ?? undefined,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!account) return true;

            if (account.provider === 'credentials') {
                return true;
            }

            await dbConnect();
            const email =
                user.email?.toLowerCase() ||
                (profile as { email?: string })?.email?.toLowerCase();
            if (!email) return false;

            const name =
                user.name ||
                (profile as { name?: string })?.name ||
                email.split('@')[0];

            const providerAccountId = String(
                account.providerAccountId || account.sub || user.id || email
            );

            const dbUser = await upsertOAuthUser({
                email,
                name,
                provider: account.provider,
                providerAccountId,
                image: user.image ?? undefined,
                emailVerified: account.provider !== 'apple',
            });

            user.id = dbUser._id.toString();
            (user as { role?: string }).role = dbUser.role;
            user.name = dbUser.name;
            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.userId = user.id;
                token.role = (user as { role?: string }).role || 'user';
                token.email = user.email;
                token.name = user.name;
            }
            if (account?.provider === 'credentials' && user?.email && user?.id) {
                await dbConnect();
                await linkCredentialsUser(user.email, user.id);
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.userId as string;
                (session.user as { role?: string }).role = (token.role as string) || 'user';
            }
            return session;
        },
    },
});

declare module 'next-auth' {
    interface User {
        role?: string;
    }
    interface Session {
        user: {
            id: string;
            email?: string | null;
            name?: string | null;
            image?: string | null;
            role?: string;
        };
    }
}
