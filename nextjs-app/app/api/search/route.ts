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

        let cases: Record<string, unknown>[] = [];

        try {
            cases = await Case.find(
                { user_id: userId, $text: { $search: q } },
                { score: { $meta: 'textScore' } }
            )
                .sort({ score: { $meta: 'textScore' } })
                .limit(20)
                .lean();
        } catch {
            // Text index may not exist yet — fall back to regex
            const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            cases = await Case.find({
                user_id: userId,
                $or: [{ title: regex }, { 'clauses.text': regex }, { 'clauses.heading': regex }],
            })
                .limit(20)
                .lean();
        }

        const results: Record<string, unknown>[] = [];
        const queryLower = q.toLowerCase();

        for (const c of cases) {
            if ((c.title as string)?.toLowerCase().includes(queryLower)) {
                results.push({
                    type: 'case',
                    case_id: c.case_id,
                    title: c.title,
                    match: c.title,
                    date: c.date,
                });
            }

            for (const clause of (c.clauses as Record<string, unknown>[]) || []) {
                const heading = (clause.heading as string) || '';
                const body = (clause.body as string) || (clause.text as string) || '';
                if (heading.toLowerCase().includes(queryLower) || body.toLowerCase().includes(queryLower)) {
                    const fullText = `${heading} ${body}`;
                    const idx = fullText.toLowerCase().indexOf(queryLower);
                    const start = Math.max(0, idx - 40);
                    const end = Math.min(fullText.length, idx + q.length + 80);
                    const snippet =
                        (start > 0 ? '...' : '') + fullText.slice(start, end) + (end < fullText.length ? '...' : '');

                    results.push({
                        type: 'clause',
                        case_id: c.case_id,
                        case_title: c.title,
                        clause_id: clause.clause_id,
                        heading: heading || 'Untitled Clause',
                        match: snippet,
                        severity: ((c.risks as Record<string, unknown>[]) || []).find(
                            (r) => r.clause_id === clause.clause_id
                        )?.severity,
                    });
                }
            }

            for (const risk of (c.risks as Record<string, unknown>[]) || []) {
                const rationale = (risk.rationale as string) || '';
                if (rationale.toLowerCase().includes(queryLower)) {
                    const idx = rationale.toLowerCase().indexOf(queryLower);
                    const start = Math.max(0, idx - 40);
                    const end = Math.min(rationale.length, idx + q.length + 80);
                    const snippet =
                        (start > 0 ? '...' : '') + rationale.slice(start, end) + (end < rationale.length ? '...' : '');

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

            if (results.length >= 50) break;
        }

        return NextResponse.json({ results, total: results.length });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Search failed';
        return NextResponse.json({ results: [], error: message });
    }
}
