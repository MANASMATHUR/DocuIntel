import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { email, password, demo } = await request.json();

        await dbConnect();

        // Demo login: new isolated guest user each time (no shared tenant with other demos)
        if (demo) {
            const guestEmail = `guest+${randomUUID()}@docuintel.internal`.toLowerCase();
            const randomSecret = randomUUID() + randomUUID();
            const hashedPassword = await bcrypt.hash(randomSecret, 12);
            const user = await User.create({
                email: guestEmail,
                password: hashedPassword,
                name: 'Demo visitor',
                isGuest: true,
            });

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

        // Regular login
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
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
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Login failed. Please try again.' },
            { status: 500 }
        );
    }
}
