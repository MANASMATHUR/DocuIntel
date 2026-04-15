import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import ResetToken from '@/lib/db/models/ResetToken';

export async function POST(request: NextRequest) {
    try {
        const { token, newPassword } = await request.json();

        if (!token || !newPassword) {
            return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        await dbConnect();

        const resetToken = await ResetToken.findOne({
            token,
            used: false,
            expiresAt: { $gt: new Date() },
        });

        if (!resetToken) {
            return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await User.findByIdAndUpdate(resetToken.userId, { password: hashedPassword });

        // Mark token as used
        resetToken.used = true;
        await resetToken.save();

        return NextResponse.json({ success: true, message: 'Password updated. You can now sign in.' });
    } catch (error: any) {
        console.error('Verify reset error:', error);
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}
