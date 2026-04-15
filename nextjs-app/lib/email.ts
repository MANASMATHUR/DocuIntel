import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'DocuIntel <onboarding@resend.dev>';

export async function sendPasswordResetEmail(to: string, resetUrl: string, userName: string): Promise<boolean> {
    if (!resend) {
        console.warn('[Email] RESEND_API_KEY not set. Reset URL:', resetUrl);
        return false;
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: 'Reset your DocuIntel password',
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f9fafb; padding:40px 0;">
    <div style="max-width:480px; margin:0 auto; background:#fff; border-radius:12px; border:1px solid #e5e7eb; overflow:hidden;">
        <div style="background:#2563EB; padding:24px 32px;">
            <h1 style="color:#fff; font-size:20px; margin:0;">DocuIntel</h1>
        </div>
        <div style="padding:32px;">
            <p style="font-size:15px; color:#111827; margin-bottom:8px;">Hi ${userName},</p>
            <p style="font-size:14px; color:#4B5563; line-height:1.6; margin-bottom:24px;">
                We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.
            </p>
            <a href="${resetUrl}" style="display:inline-block; background:#2563EB; color:#fff; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:600; text-decoration:none;">
                Reset Password
            </a>
            <p style="font-size:12px; color:#9CA3AF; margin-top:24px; line-height:1.5;">
                If you didn't request this, you can safely ignore this email. Your password won't change.
            </p>
            <hr style="border:none; border-top:1px solid #E5E7EB; margin:24px 0;">
            <p style="font-size:11px; color:#9CA3AF;">
                Can't click the button? Copy this link:<br>
                <a href="${resetUrl}" style="color:#2563EB; word-break:break-all;">${resetUrl}</a>
            </p>
        </div>
    </div>
</body>
</html>`,
        });
        return true;
    } catch (error) {
        console.error('[Email] Failed to send:', error);
        return false;
    }
}
