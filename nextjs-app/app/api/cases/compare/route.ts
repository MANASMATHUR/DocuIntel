import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Case from '@/lib/db/models/Case';

export async function POST(request: NextRequest) {
    const userId = request.headers.get('X-User-Id') || 'anonymous';

    try {
        const { caseIdA, caseIdB } = await request.json();
        if (!caseIdA || !caseIdB) {
            return NextResponse.json({ error: 'Two case IDs required' }, { status: 400 });
        }

        await dbConnect();

        const [caseA, caseB] = await Promise.all([
            Case.findOne({ case_id: caseIdA, user_id: userId }).lean(),
            Case.findOne({ case_id: caseIdB, user_id: userId }).lean(),
        ]);

        if (!caseA || !caseB) {
            return NextResponse.json({ error: 'One or both cases not found' }, { status: 404 });
        }

        // Build comparison
        const summaryA = (caseA as any).summary || {};
        const summaryB = (caseB as any).summary || {};
        const risksA = (caseA as any).risks || [];
        const risksB = (caseB as any).risks || [];
        const clausesA = (caseA as any).clauses || [];
        const clausesB = (caseB as any).clauses || [];

        const comparison = {
            caseA: {
                case_id: (caseA as any).case_id,
                title: (caseA as any).title,
                date: (caseA as any).date,
                clauseCount: clausesA.length,
                summary: summaryA,
                severityBreakdown: {
                    critical: risksA.filter((r: any) => r.severity === 'critical').length,
                    high: risksA.filter((r: any) => r.severity === 'high').length,
                    medium: risksA.filter((r: any) => r.severity === 'medium').length,
                    low: risksA.filter((r: any) => r.severity === 'low').length,
                },
                topRisks: risksA
                    .filter((r: any) => r.severity === 'critical' || r.severity === 'high')
                    .slice(0, 5)
                    .map((r: any) => ({ clause_id: r.clause_id, severity: r.severity, rationale: r.rationale })),
            },
            caseB: {
                case_id: (caseB as any).case_id,
                title: (caseB as any).title,
                date: (caseB as any).date,
                clauseCount: clausesB.length,
                summary: summaryB,
                severityBreakdown: {
                    critical: risksB.filter((r: any) => r.severity === 'critical').length,
                    high: risksB.filter((r: any) => r.severity === 'high').length,
                    medium: risksB.filter((r: any) => r.severity === 'medium').length,
                    low: risksB.filter((r: any) => r.severity === 'low').length,
                },
                topRisks: risksB
                    .filter((r: any) => r.severity === 'critical' || r.severity === 'high')
                    .slice(0, 5)
                    .map((r: any) => ({ clause_id: r.clause_id, severity: r.severity, rationale: r.rationale })),
            },
            delta: {
                clauseCount: clausesB.length - clausesA.length,
                critical: (summaryB.critical || 0) - (summaryA.critical || 0),
                high: (summaryB.high || 0) - (summaryA.high || 0),
                medium: (summaryB.medium || 0) - (summaryA.medium || 0),
                low: (summaryB.low || 0) - (summaryA.low || 0),
                totalRisk: (risksB.length) - (risksA.length),
            },
        };

        return NextResponse.json(comparison);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
