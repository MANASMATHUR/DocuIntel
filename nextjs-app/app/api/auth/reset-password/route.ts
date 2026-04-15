import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import ResetToken from '@/lib/db/models/ResetToken';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.' });
        }

        // Invalidate any existing tokens for this user
        await ResetToken.updateMany({ userId: user._id.toString(), used: false }, { $set: { used: true } });

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await ResetToken.create({
            userId: user._id.toString(),
            email: user.email,
            token,
            expiresAt,
        });

        // Build reset URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;

        // Send email
        const sent = await sendPasswordResetEmail(user.email, resetUrl, user.name);
        if (!sent) {
            console.warn('[Reset] Email not sent (RESEND_API_KEY missing). Token:', token);
        }

        return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}
