import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Case from '@/lib/db/models/Case';

export async function GET(request: NextRequest) {
    const userId = request.headers.get('X-User-Id') || 'anonymous';
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
        return NextResponse.json({ results: [] });
    }

    try {
        await dbConnect();

        const cases = await Case.find({ user_id: userId }).lean();
        const results: any[] = [];
        const queryLower = q.toLowerCase();

        for (const c of cases as any[]) {
            // Search in case title
            if (c.title?.toLowerCase().includes(queryLower)) {
                results.push({
                    type: 'case',
                    case_id: c.case_id,
                    title: c.title,
                    match: c.title,
                    date: c.date,
                });
            }

            // Search in clauses
            for (const clause of (c.clauses || [])) {
                const heading = clause.heading || '';
                const body = clause.body || clause.text || '';
                if (heading.toLowerCase().includes(queryLower) || body.toLowerCase().includes(queryLower)) {
                    // Find the matching snippet
                    const fullText = `${heading} ${body}`;
                    const idx = fullText.toLowerCase().indexOf(queryLower);
                    const start = Math.max(0, idx - 40);
                    const end = Math.min(fullText.length, idx + q.length + 80);
                    const snippet = (start > 0 ? '...' : '') + fullText.slice(start, end) + (end < fullText.length ? '...' : '');

                    results.push({
                        type: 'clause',
                        case_id: c.case_id,
                        case_title: c.title,
                        clause_id: clause.clause_id,
                        heading: heading || 'Untitled Clause',
                        match: snippet,
                        severity: (c.risks || []).find((r: any) => r.clause_id === clause.clause_id)?.severity,
                    });
                }
            }

            // Search in risk rationales
            for (const risk of (c.risks || [])) {
                if (risk.rationale?.toLowerCase().includes(queryLower)) {
                    const idx = risk.rationale.toLowerCase().indexOf(queryLower);
                    const start = Math.max(0, idx - 40);
                    const end = Math.min(risk.rationale.length, idx + q.length + 80);
                    const snippet = (start > 0 ? '...' : '') + risk.rationale.slice(start, end) + (end < risk.rationale.length ? '...' : '');

                    results.push({
                        type: 'risk',
                        case_id: c.case_id,
                        case_title: c.title,
                        clause_id: risk.clause_id,
                        severity: risk.severity,
                        match: snippet,
                    });
                }
            }

            if (results.length >= 50) break; // Cap results
        }

        return NextResponse.json({ results, total: results.length });
    } catch (error: any) {
        return NextResponse.json({ results: [], error: error.message });
    }
}
