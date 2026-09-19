import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import ResetToken from '@/lib/db/models/ResetToken';
import { resetPasswordVerifySchema } from '@/lib/validators/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = resetPasswordVerifySchema.safeParse({
            token: body.token,
            password: body.newPassword ?? body.password,
        });
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Invalid input' },
                { status: 400 }
            );
        }

        const { token, password } = parsed.data;

        await dbConnect();

        const resetToken = await ResetToken.findOne({
            token,
            used: false,
            expiresAt: { $gt: new Date() },
        });

        if (!resetToken) {
            return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        await User.findByIdAndUpdate(resetToken.userId, { password: hashedPassword });

        resetToken.used = true;
        await resetToken.save();

        return NextResponse.json({ success: true, message: 'Password updated. You can now sign in.' });
    } catch (error: unknown) {
        console.error('Verify reset error:', error);
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}
