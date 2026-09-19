import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { createToken, setAuthCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validators/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = loginSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Invalid input' },
                { status: 400 }
            );
        }

        const { email, password, demo } = parsed.data;

        let dbAvailable = true;
        try {
            await dbConnect();
        } catch (e) {
            console.warn('DB connection failed in login route, using fallback mode');
            dbAvailable = false;
        }

        // Demo login: dev-only, rate-limited
        if (demo) {
            if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_LOGIN !== 'true') {
                return NextResponse.json({ error: 'Demo login is disabled in production' }, { status: 403 });
            }

            const demoLimit = rateLimit(`demo:${getClientIp(request)}`, 5, 60 * 60 * 1000);
            if (!demoLimit.success) {
                return NextResponse.json({ error: 'Demo login limit reached. Try again later.' }, { status: 429 });
            }

            const guestEmail = `guest+${randomUUID()}@docuintel.internal`.toLowerCase();
            const randomSecret = randomUUID() + randomUUID();
            const hashedPassword = await bcrypt.hash(randomSecret, 12);
            const guestExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            let user;
            if (dbAvailable) {
                user = await User.create({
                    email: guestEmail,
                    password: hashedPassword,
                    name: 'Demo visitor',
                    isGuest: true,
                    guestExpiresAt,
                });
            } else {
                const { createFallbackUser } = await import('@/lib/db/memory-fallback');
                user = createFallbackUser({
                    email: guestEmail,
                    password: hashedPassword,
                    name: 'Demo visitor',
                    isGuest: true,
                    guestExpiresAt,
                });
            }

            const token = await createToken({
                userId: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
            });

            setAuthCookie(token);

            return NextResponse.json({
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isGuest: true,
                },
            });
        }

        let user;
        if (dbAvailable) {
            user = await User.findOne({ email: email.toLowerCase() });
        } else {
            const { getFallbackUserByEmail } = await import('@/lib/db/memory-fallback');
            user = getFallbackUserByEmail(email.toLowerCase());
        }

        if (!user?.password) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const token = await createToken({
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
        });

        setAuthCookie(token);

        return NextResponse.json({
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error: unknown) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
    }
}
