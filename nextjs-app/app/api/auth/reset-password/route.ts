import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import ResetToken from '@/lib/db/models/ResetToken';
import { sendPasswordResetEmail } from '@/lib/email';
import { resetPasswordRequestSchema } from '@/lib/validators/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = resetPasswordRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Invalid input' },
                { status: 400 }
            );
        }

        const { email } = parsed.data;

        await dbConnect();

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.' });
        }

        await ResetToken.updateMany({ userId: user._id.toString(), used: false }, { $set: { used: true } });

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await ResetToken.create({
            userId: user._id.toString(),
            email: user.email,
            token,
            expiresAt,
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;

        const sent = await sendPasswordResetEmail(user.email, resetUrl, user.name);
        if (!sent) {
            console.warn('[Reset] Email not sent (RESEND_API_KEY missing). Token:', token);
        }

        return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    } catch (error: unknown) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}
