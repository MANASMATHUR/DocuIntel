import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { createToken, setAuthCookieOnResponse } from '@/lib/auth';
import { registerSchema } from '@/lib/validators/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Invalid input' },
                { status: 400 }
            );
        }

        const { email, password, name } = parsed.data;

        let dbAvailable = true;
        try {
            await dbConnect();
        } catch (e) {
            console.warn('DB connection failed in register route, using fallback mode');
            dbAvailable = false;
        }

        let existing;
        if (dbAvailable) {
            existing = await User.findOne({ email: email.toLowerCase() });
        } else {
            const { getFallbackUserByEmail } = await import('@/lib/db/memory-fallback');
            existing = getFallbackUserByEmail(email.toLowerCase());
        }

        if (existing) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        let user;
        if (dbAvailable) {
            user = await User.create({
                email: email.toLowerCase(),
                password: hashedPassword,
                name: name.trim(),
                accounts: [{ provider: 'credentials', providerAccountId: email.toLowerCase() }],
            });
        } else {
            const { createFallbackUser } = await import('@/lib/db/memory-fallback');
            user = createFallbackUser({
                email: email.toLowerCase(),
                password: hashedPassword,
                name: name.trim(),
                role: 'user',
            });
        }

        const token = await createToken({
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || 'user',
        });

        const response = NextResponse.json({
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role || 'user',
            },
        });
        setAuthCookieOnResponse(response, token);
        return response;

    } catch (error: unknown) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Registration failed. Please try again.' },
            { status: 500 }
        );
    }
}
