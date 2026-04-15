import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { createToken, setAuthCookie, DEMO_USER } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { email, password, demo } = await request.json();

        await dbConnect();

        // Demo login: auto-create demo user if needed
        if (demo) {
            let user = await User.findOne({ email: DEMO_USER.email });
            if (!user) {
                const hashedPassword = await bcrypt.hash(DEMO_USER.password, 12);
                user = await User.create({
                    email: DEMO_USER.email,
                    password: hashedPassword,
                    name: DEMO_USER.name,
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
