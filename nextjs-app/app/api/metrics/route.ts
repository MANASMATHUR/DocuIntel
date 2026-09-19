/**
 * Metrics API Route
 * 
 * Provides performance metrics for the DocuIntel assistant.
 */

import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const report = metrics.getReport();
        const summary = metrics.getSummary();

        return NextResponse.json({
            report,
            summary,
            timestamp: Date.now()
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch metrics' },
            { status: 500 }
        );
    }
}
