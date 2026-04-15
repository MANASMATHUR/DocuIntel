import dbConnect from './db/mongodb';
import User from './db/models/User';

interface AnalysisEvent {
    type: 'analysis_complete';
    caseId: string;
    title: string;
    clauseCount: number;
    criticalCount: number;
    highCount: number;
    userId: string;
    userName: string;
}

interface WebhookEvent {
    event: string;
    data: any;
    timestamp: string;
}

/**
 * Fire all notifications for a completed analysis.
 * Called from the cases POST route after analysis is done.
 */
export async function notifyAnalysisComplete(event: AnalysisEvent) {
    await dbConnect();
    const user = await User.findById(event.userId).lean() as any;
    if (!user) return;

    const promises: Promise<void>[] = [];

    // Slack notification
    if (user.slackWebhookUrl) {
        promises.push(sendSlackNotification(user.slackWebhookUrl, event));
    }

    // Outgoing webhook (Zapier/n8n)
    if (user.webhookUrl) {
        const events = user.webhookEvents || ['analysis_complete'];
        if (events.includes('analysis_complete')) {
            promises.push(sendWebhook(user.webhookUrl, {
                event: 'analysis_complete',
                data: {
                    case_id: event.caseId,
                    title: event.title,
                    clauses: event.clauseCount,
                    critical_risks: event.criticalCount,
                    high_risks: event.highCount,
                },
                timestamp: new Date().toISOString(),
            }));
        }
    }

    // Email notification (via Resend if configured)
    if (process.env.RESEND_API_KEY) {
        promises.push(sendEmailNotification(user.email, user.name, event));
    }

    await Promise.allSettled(promises);
}

async function sendSlackNotification(webhookUrl: string, event: AnalysisEvent) {
    try {
        const riskEmoji = event.criticalCount > 0 ? '🔴' : event.highCount > 0 ? '🟡' : '🟢';
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `${riskEmoji} *DocuIntel Analysis Complete*`,
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `${riskEmoji} *Analysis Complete: ${event.title}*\n${event.clauseCount} clauses analyzed | ${event.criticalCount} critical | ${event.highCount} high risks`,
                        },
                    },
                ],
            }),
        });
    } catch (err) {
        console.error('[Slack] Notification failed:', err);
    }
}

async function sendWebhook(url: string, payload: WebhookEvent) {
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-DocuIntel-Event': payload.event },
            body: JSON.stringify(payload),
        });
    } catch (err) {
        console.error('[Webhook] Delivery failed:', err);
    }
}

async function sendEmailNotification(email: string, name: string, event: AnalysisEvent) {
    try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const riskSummary = event.criticalCount > 0
            ? `${event.criticalCount} critical risk${event.criticalCount > 1 ? 's' : ''} found`
            : event.highCount > 0
                ? `${event.highCount} high risk${event.highCount > 1 ? 's' : ''} found`
                : 'No major risks detected';

        await resend.emails.send({
            from: process.env.EMAIL_FROM || 'DocuIntel <onboarding@resend.dev>',
            to: email,
            subject: `Analysis complete: ${event.title}`,
            html: `
<div style="font-family:sans-serif; max-width:480px; margin:0 auto; padding:24px;">
    <h2 style="color:#2563EB; margin-bottom:16px;">Analysis Complete</h2>
    <p>Hi ${name},</p>
    <p>Your contract <strong>${event.title}</strong> has been analyzed.</p>
    <div style="background:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px; padding:16px; margin:16px 0;">
        <p style="margin:4px 0;"><strong>${event.clauseCount}</strong> clauses analyzed</p>
        <p style="margin:4px 0;">${riskSummary}</p>
    </div>
    <p>Log in to DocuIntel to review the full report.</p>
</div>`,
        });
    } catch (err) {
        console.error('[Email] Notification failed:', err);
    }
}
