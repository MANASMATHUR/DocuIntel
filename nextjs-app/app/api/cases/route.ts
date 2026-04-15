import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { RiskEngine } from '@/lib/services/risk-engine'
import { aiService } from '@/lib/services/ai-service'
import os from 'os'
import dbConnect from '@/lib/db/mongodb'
import Case from '@/lib/db/models/Case'

// In-memory fallback store for when MongoDB is unavailable
const inMemoryStore: Map<string, any> = (global as any).__caseStore ?? new Map();
(global as any).__caseStore = inMemoryStore;

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id') || 'anonymous';

    try {
      await dbConnect();
    } catch (dbError: any) {
      console.warn('MongoDB connection failed, continuing without persistence:', dbError.message);
    }

    // Check plan limits
    try {
      const { checkAnalysisLimit, incrementAnalysisCount } = await import('@/lib/plan-check');
      const limitCheck = await checkAnalysisLimit(userId);
      if (!limitCheck.allowed) {
        return NextResponse.json({ error: limitCheck.reason, upgrade: true }, { status: 403 });
      }
      await incrementAnalysisCount(userId);
    } catch { /* plan check is best-effort */ }

    const formData = await request.formData()
    const primaryDocs = formData.getAll('primary_docs') as File[]
    const instructions = formData.get('instructions') as string || 'Standard commercial terms'

    if (primaryDocs.length === 0) {
      return NextResponse.json(
        { error: 'At least one primary document is required' },
        { status: 400 }
      )
    }

    const caseId = `case-${uuidv4()}`
    const tmpDir = join(os.tmpdir(), caseId)
    await mkdir(tmpDir, { recursive: true })

    // Save all primary documents to temp dir
    const filePaths: string[] = [];
    for (const doc of primaryDocs) {
      const bytes = await doc.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = join(tmpDir, doc.name);
      await writeFile(filePath, buffer);
      filePaths.push(filePath);
    }
    const doc = primaryDocs[0];
    const filePath = filePaths[0];

    const useDeepAnalysis = formData.get('deep_analysis') === 'true';
    let result;
    let analysisMeta: {
      requestedMode: 'standard' | 'gpu-beta';
      actualMode: 'standard' | 'gpu-beta';
      fallbackUsed: boolean;
      message?: string;
    } = {
      requestedMode: useDeepAnalysis ? 'gpu-beta' : 'standard',
      actualMode: useDeepAnalysis ? 'gpu-beta' : 'standard',
      fallbackUsed: false,
    };

    if (useDeepAnalysis) {
      console.log('🚀 Triggering Deep Analysis (GPU)...');
      try {
        result = await aiService.analyzeWithPythonBackend(doc, instructions);
      } catch (gpuError: any) {
        console.warn('GPU beta analysis failed, falling back to standard mode:', gpuError.message);
        result = await RiskEngine.analyzeDocument(filePath, caseId, instructions);
        analysisMeta = {
          requestedMode: 'gpu-beta',
          actualMode: 'standard',
          fallbackUsed: true,
          message: gpuError.message || 'GPU backend unavailable. Standard analysis was used instead.',
        };
      }
    } else {
      // Run Node.js Risk Engine (supports multiple documents)
      if (filePaths.length > 1) {
        result = await RiskEngine.analyzeMultipleDocuments(filePaths, caseId, instructions);
      } else {
        result = await RiskEngine.analyzeDocument(filePath, caseId, instructions);
      }
    }

    // Clean up temp files
    RiskEngine.cleanupTempDir(tmpDir);

    // Normalize result structure
    // Map clause `text` → `body` so ClauseViewer can display it
    let finalClauses = (result.clauses || []).map((c: any) => ({
      ...c,
      body: c.body || c.text || '',
    }));
    let finalRisks = result.risks;
    let finalRedlines = result.redlines;
    let finalReports = result.reports;
    let finalSummary = result.summary;

    // Coerce any value to a renderable string (guards against AI returning nested objects)
    const str = (v: any, fb = ''): string =>
      typeof v === 'string' ? v : v != null && typeof v === 'object' ? Object.values(v).map(String).join(' ') : v != null ? String(v) : fb;

    // If coming from RiskEngine (local), we need to construct risks/redlines/reports from clauses
    if (!useDeepAnalysis) {
      finalRisks = result.clauses.map((c: any) => ({
        clause_id: c.clause_id,
        risk_score: c.risk_score,
        severity: c.severity,
        rationale: str(c.rationale, 'No risk detected'),
        negotiation_scenarios: c.negotiation_scenarios
      }));

      finalRedlines = {
        patches: result.clauses.filter((c: any) => c.redline).map((c: any) => ({
          clause_id: c.clause_id,
          patch: str(c.redline),
          rationale: str(c.recommendation)
        }))
      };

      finalReports = {
        executive_summary: {
          headline: `Analyzed ${result.clauses.length} clauses. Found ${result.summary.critical} critical risks.`,
          risk_counts: result.summary,
          top_issues: result.clauses.filter((c: any) => c.severity === 'critical' || c.severity === 'high').map((c: any) => str(c.rationale)),
          remediation_plan: ["Review critical redlines", "Escalate high risks to legal counsel"]
        }
      };
    } else {
      // If coming from Python, summary might be nested in reports
      if (!finalSummary && result.reports?.executive_summary?.risk_counts) {
        finalSummary = result.reports.executive_summary.risk_counts;
      }
      // Coerce Python backend string fields in case they're objects
      if (finalRisks && Array.isArray(finalRisks)) {
        finalRisks = finalRisks.map((r: any) => ({ ...r, rationale: str(r.rationale, 'No risk detected') }));
      }
      if (finalReports?.executive_summary?.top_issues) {
        finalReports.executive_summary.top_issues = finalReports.executive_summary.top_issues.map((i: any) => str(i));
      }
    }

    // Collect logs and vector stats from analysis result
    const finalLogs = result.logs || [];
    const finalVectorStats = result.vectorStats || { documentCount: 0, isReady: false };

    // Save to MongoDB (if available)
    let savedCase;
    const now = new Date();
    try {
      const created = await Case.create({
        case_id: caseId,
        user_id: userId,
        title: doc.name,
        type: 'Contract',
        status: 'completed',
        date: now,
        instructions,
        clauses: finalClauses,
        risks: finalRisks,
        redlines: finalRedlines,
        reports: finalReports,
        summary: finalSummary,
        logs: finalLogs,
        vectorStats: finalVectorStats,
        analysis_meta: analysisMeta
      });
      savedCase = created.toObject();
      // Ensure date field is present
      if (!savedCase.date) {
        savedCase.date = savedCase.createdAt || now;
      }
    } catch (dbError: any) {
      console.warn('Failed to save to MongoDB, using in-memory store:', dbError.message);
      savedCase = {
        case_id: caseId,
        user_id: userId,
        title: doc.name,
        type: 'Contract',
        status: 'completed',
        date: now.toISOString(),
        instructions,
        clauses: finalClauses,
        risks: finalRisks,
        redlines: finalRedlines,
        reports: finalReports,
        summary: finalSummary,
        logs: finalLogs,
        vectorStats: finalVectorStats,
        analysis_meta: analysisMeta
      };
      inMemoryStore.set(caseId, savedCase);
    }

    // Update user stats
    try {
      const User = (await import('@/lib/db/models/User')).default;
      const clauseCount = finalClauses?.length || 0;
      const criticalCount = finalSummary?.critical || 0;
      await User.findByIdAndUpdate(userId, {
        $inc: {
          'stats.casesAnalyzed': 1,
          'stats.clausesReviewed': clauseCount,
          'stats.criticalRisksFound': criticalCount,
        }
      });
    } catch { /* stats update is best-effort */ }

    // Fire notifications (non-blocking)
    try {
      const { notifyAnalysisComplete } = await import('@/lib/notifications');
      const userName = request.headers.get('X-User-Name') || 'User';
      notifyAnalysisComplete({
        type: 'analysis_complete',
        caseId,
        title: doc.name,
        clauseCount: finalClauses?.length || 0,
        criticalCount: finalSummary?.critical || 0,
        highCount: finalSummary?.high || 0,
        userId,
        userName,
      }); // intentionally not awaited
    } catch { /* notifications are best-effort */ }

    return NextResponse.json(savedCase)
  } catch (error: any) {
    console.error('Case creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create case' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id') || 'anonymous';
  const { searchParams } = new URL(request.url)
  const caseId = searchParams.get('case_id')

  let dbAvailable = false;
  try {
    await dbConnect();
    dbAvailable = true;
  } catch (dbError: any) {
    console.warn('MongoDB unavailable, using in-memory store:', dbError.message);
  }

  try {
    if (!caseId) {
      let cases: any[] = [];

      if (dbAvailable) {
        const dbCases = await Case.find({ user_id: userId }).sort({ createdAt: -1 });
        cases = dbCases.map((c: any) => ({
          ...c.toObject(),
          date: c.date || c.createdAt || new Date()
        }));
      }

      // Merge in-memory cases for this user
      const memCases = Array.from(inMemoryStore.values()).filter((c: any) => c.user_id === userId);
      const dbCaseIds = new Set(cases.map((c: any) => c.case_id));
      for (const mc of memCases) {
        if (!dbCaseIds.has(mc.case_id)) {
          cases.push(mc);
        }
      }

      cases.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return NextResponse.json({ cases })
    }

    // Single case lookup (scoped to user)
    if (dbAvailable) {
      const result = await Case.findOne({ case_id: caseId, user_id: userId });
      if (result) {
        const resultObj = result.toObject();
        if (!resultObj.date) resultObj.date = resultObj.createdAt || new Date();
        return NextResponse.json(resultObj);
      }
    }

    const memCase = inMemoryStore.get(caseId);
    if (memCase && memCase.user_id === userId) {
      return NextResponse.json(memCase);
    }

    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  } catch (error: any) {
    console.error('Case fetch error:', error);
    const memCases = Array.from(inMemoryStore.values()).filter((c: any) => c.user_id === userId);
    if (caseId) {
      const found = memCases.find((c: any) => c.case_id === caseId);
      return found ? NextResponse.json(found) : NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    return NextResponse.json({ cases: memCases })
  }
}

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('X-User-Id') || 'anonymous';
  try {
    const { case_id, title, starred } = await request.json();
    if (!case_id) return NextResponse.json({ error: 'case_id required' }, { status: 400 });

    await dbConnect();
    const update: any = {};
    if (title !== undefined) update.title = title;
    if (starred !== undefined) update.starred = starred;

    const result = await Case.findOneAndUpdate(
      { case_id, user_id: userId },
      { $set: update },
      { new: true }
    );

    if (!result) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    return NextResponse.json(result.toObject());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
