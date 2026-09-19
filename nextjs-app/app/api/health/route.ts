import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { getConfiguredOAuthProviders } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
    const started = Date.now();
    const checks: Record<string, { ok: boolean; detail?: string }> = {};

    // MongoDB
    try {
        await dbConnect();
        checks.mongodb = { ok: true };
    } catch (e) {
        checks.mongodb = {
            ok: false,
            detail: e instanceof Error ? e.message : 'connection failed',
        };
    }

    // Auth secrets (production)
    const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
    const devDefault = 'docuintel-dev-secret-change-in-prod';
    if (process.env.NODE_ENV === 'production') {
        checks.auth_secret = {
            ok: !!secret && secret !== devDefault,
            detail: secret && secret !== devDefault ? undefined : 'AUTH_SECRET required',
        };
    } else {
        checks.auth_secret = { ok: true, detail: 'dev mode' };
    }

    // Optional services
    checks.openai = {
        ok: !!process.env.OPENAI_API_KEY,
        detail: process.env.OPENAI_API_KEY ? 'configured' : 'mock/fallback mode',
    };
    checks.stripe = { ok: !!process.env.STRIPE_SECRET_KEY };
    checks.email = { ok: !!process.env.RESEND_API_KEY };

    const oauth = getConfiguredOAuthProviders();
    checks.oauth = { ok: oauth.length > 0, detail: oauth.join(', ') || 'none' };

    // Python backend (optional)
    let pythonBackend: { ok: boolean; detail?: string } = { ok: false, detail: 'not configured' };
    const pyUrl = process.env.AUTOLAWYER_PYTHON_BACKEND_URL;
    if (pyUrl) {
        try {
            const res = await fetch(`${pyUrl}/api/health`, { signal: AbortSignal.timeout(3000) });
            pythonBackend = { ok: res.ok, detail: res.ok ? 'healthy' : `status ${res.status}` };
        } catch {
            pythonBackend = { ok: false, detail: 'unreachable' };
        }
    }
    checks.python_backend = pythonBackend;

    const allCriticalOk = checks.mongodb.ok && checks.auth_secret.ok;
    const status = allCriticalOk ? 'healthy' : checks.mongodb.ok ? 'degraded' : 'unhealthy';

    return NextResponse.json(
        {
            status,
            service: 'docuintel-api',
            version: process.env.npm_package_version || '1.0.0',
            uptime_ms: Date.now() - started,
            checks,
            timestamp: new Date().toISOString(),
        },
        { status: allCriticalOk ? 200 : 503 }
    );
}
