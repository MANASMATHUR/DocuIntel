import { NextResponse } from 'next/server';
import { getConfiguredOAuthProviders } from '@/lib/env';

export const dynamic = 'force-dynamic';

/** Public: which social login providers are configured (no secrets exposed) */
export async function GET() {
    return NextResponse.json({
        providers: getConfiguredOAuthProviders(),
        credentials: true,
        demo:
            process.env.NODE_ENV !== 'production' ||
            process.env.ALLOW_DEMO_LOGIN === 'true' ||
            process.env.NEXT_PUBLIC_ALLOW_DEMO_LOGIN === 'true',
    });
}
