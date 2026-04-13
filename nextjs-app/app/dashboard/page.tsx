'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { RiskChart } from '@/components/ui/risk-chart';
import { DiffViewer } from '@/components/ui/diff-viewer';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Loader2, Download, MessageSquare, Zap, ChevronRight, Hash, Database, Pin, Link2, ExternalLink } from 'lucide-react';
import { NegotiationModal } from '@/components/modals/negotiation-modal';
import AgentLogs from '@/app/components/AgentLogs';
import PerformanceDashboard from '@/app/components/PerformanceDashboard';
import ClauseViewer from '@/app/components/ClauseViewer';
import { useSearchParams } from 'next/navigation';
import { CaseCollaborationPanel } from '@/components/case-collaboration-panel';
import { RiskTrendSnapshot } from '@/components/risk-trend-snapshot';
import { appendRiskSnapshot, loadRiskHistory, type RiskSnapshot } from '@/lib/risk-history';
import { useCaseCollaboration } from '@/lib/hooks/useCaseCollaboration';

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [riskHistory, setRiskHistory] = useState<RiskSnapshot[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [negotiationState, setNegotiationState] = useState<{
    isOpen: boolean;
    clause: string;
    scenario: any;
  }>({
    isOpen: false,
    clause: '',
    scenario: null,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    const caseId = searchParams.get('case_id');
    if (!caseId) return;

    const loadCase = async () => {
      try {
        const res = await fetch(`/api/cases?case_id=${encodeURIComponent(caseId)}`);
        if (!res.ok) return;
        const data = await res.json();
        setResult(data);
        setActiveTab('overview');
        if (data.analysis_meta?.fallbackUsed) {
          setAnalysisNotice('GPU beta was unavailable for this case; standard analysis results are shown.');
        }
      } catch (error) {
        console.error('Failed to load case:', error);
      }
    };

    loadCase();
  }, [searchParams]);

  const collab = useCaseCollaboration(result?.case_id ?? null);

  const riskCountsKey = useMemo(() => {
    const rc = result?.reports?.executive_summary?.risk_counts || result?.summary;
    return JSON.stringify(rc || {});
  }, [result?.reports?.executive_summary?.risk_counts, result?.summary]);

  useEffect(() => {
    if (!result?.case_id) {
      setRiskHistory([]);
      return;
    }
    const rc = result.reports?.executive_summary?.risk_counts || result.summary || {};
    const next = appendRiskSnapshot(result.case_id, {
      critical: Number(rc.critical) || 0,
      high: Number(rc.high) || 0,
      medium: Number(rc.medium) || 0,
      low: Number(rc.low) || 0,
    });
    setRiskHistory(next.length ? next : loadRiskHistory(result.case_id));
  }, [result?.case_id, riskCountsKey]); // eslint-disable-line react-hooks/exhaustive-deps -- riskCountsKey serializes counts

  const analyzeContract = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    const formData = new FormData();
    formData.append('primary_docs', file);
    formData.append('instructions', 'Strict liability caps and mutual indemnification');

    const useDeepAnalysis = (document.getElementById('deep-analysis') as HTMLInputElement)?.checked;
    if (useDeepAnalysis) {
      formData.append('deep_analysis', 'true');
    }

    // Simulate progress updates during analysis
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 8, 90));
    }, 800);

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        body: formData,
      });
      clearInterval(progressInterval);
      setAnalysisProgress(100);

      const data = await res.json();
      if (!res.ok) {
        setAnalysisNotice(data.error || 'Analysis failed. Please try again.');
        return;
      }
      setResult(data);
      if (data.analysis_meta?.fallbackUsed) {
        setAnalysisNotice(data.analysis_meta.message || 'GPU backend unavailable, standard analysis was used.');
      } else {
        setAnalysisNotice(null);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Analysis failed:', error);
      setAnalysisNotice('Analysis failed. Please check your connection and try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const exportReport = async (format: 'txt' | 'html' = 'txt') => {
    if (!result) return;
    setIsExporting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseData: result, format }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocuIntel_Report_${result.case_id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const openExecutiveReport = async () => {
    if (!result) return;
    setShareBusy(true);
    setShareToast(null);
    try {
      const res = await fetch('/api/reports/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseData: result }),
      });
      if (!res.ok) throw new Error('Share failed');
      const { path } = await res.json();
      window.open(`${window.location.origin}${path}`, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error(e);
      setShareToast('Could not open executive report.');
    } finally {
      setShareBusy(false);
    }
  };

  const copyShareLink = async () => {
    if (!result) return;
    setShareBusy(true);
    setShareToast(null);
    try {
      const res = await fetch('/api/reports/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseData: result }),
      });
      if (!res.ok) throw new Error('Share failed');
      const { path } = await res.json();
      const url = `${window.location.origin}${path}`;
      await navigator.clipboard.writeText(url);
      setShareToast('Share link copied to clipboard.');
    } catch (e) {
      console.error(e);
      setShareToast('Could not create share link.');
    } finally {
      setShareBusy(false);
    }
  };

  const startNegotiation = () => {
    if (!result || !result.risks || result.risks.length === 0) return;

    const targetRisk = result.risks.find((r: any) => r.severity === 'critical') || result.risks[0];
    const targetClause = result.clauses.find((c: any) => c.clause_id === targetRisk.clause_id);
    const targetScenario = targetRisk.negotiation_scenarios?.[0] || { name: 'Contract Balance Review', explanation: 'General negotiation for risk mitigation.' };

    setNegotiationState({
      isOpen: true,
      clause: targetClause?.text || '',
      scenario: targetScenario,
    });
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="max-w-[1200px] mx-auto">
        {/* Header Area */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <p className="text-accent text-xs font-medium uppercase tracking-wide mb-1">Legal Analysis Workspace</p>
            <h1 className="text-2xl font-semibold tracking-tight text-text">
              Analysis Suite
            </h1>
          </div>

          {result && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openExecutiveReport}
                disabled={shareBusy}
                className="px-4 py-2 bg-white/[0.04] border border-white/[0.1] rounded-lg text-xs font-medium hover:bg-white/[0.08] transition-all flex items-center gap-2 text-text-secondary disabled:opacity-50"
              >
                {shareBusy ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                Report
              </button>
              <button
                type="button"
                onClick={copyShareLink}
                disabled={shareBusy}
                className="px-4 py-2 bg-white/[0.04] border border-white/[0.1] rounded-lg text-xs font-medium hover:bg-white/[0.08] transition-all flex items-center gap-2 text-text-secondary disabled:opacity-50"
              >
                <Link2 size={14} />
                Share
              </button>
              <button
                type="button"
                onClick={() => exportReport('html')}
                disabled={isExporting}
                className="px-4 py-2 bg-white/[0.04] border border-white/[0.1] rounded-lg text-xs font-medium hover:bg-white/[0.08] transition-all flex items-center gap-2 text-text-secondary"
              >
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                HTML
              </button>
              <button
                type="button"
                onClick={() => exportReport('txt')}
                disabled={isExporting}
                className="px-4 py-2 bg-white/[0.04] border border-white/[0.1] rounded-lg text-xs font-medium hover:bg-white/[0.08] transition-all flex items-center gap-2 text-text-secondary"
              >
                <Download size={14} />
                TXT
              </button>
              <button
                type="button"
                onClick={startNegotiation}
                className="px-5 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-dark transition-all flex items-center gap-2"
              >
                <MessageSquare size={14} />
                Negotiate
              </button>
            </div>
          )}
        </div>

        {/* Workspace */}
        <div className="relative">
          {analysisNotice && (
            <div className="mb-6 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm">
              {analysisNotice}
            </div>
          )}
          {shareToast && (
            <div className="mb-4 px-4 py-3 rounded-lg border border-white/[0.1] bg-white/[0.04] text-sm text-text-secondary">
              {shareToast}
            </div>
          )}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && !result && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-2xl mx-auto"
              >
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="bg-bg-subtle/40 p-8 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-white/[0.04] border border-white/[0.1] rounded-xl flex items-center justify-center mb-6">
                        <Upload className="w-7 h-7 text-text-secondary" />
                      </div>

                      <h3 className="text-xl font-semibold mb-2 tracking-tight text-text">
                        Begin Case Analysis
                      </h3>

                      <p className="text-text-secondary text-sm mb-8 max-w-xs">
                        Upload a contract to get risk analysis, redline suggestions, and negotiation scenarios.
                      </p>

                      <input
                        type="file"
                        onChange={handleUpload}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.docx,.txt"
                      />

                      <div className="w-full max-w-sm space-y-4">
                        {!file ? (
                          <label
                            htmlFor="file-upload"
                            className="block w-full py-3 rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer hover:bg-primary-dark transition-colors text-center"
                          >
                            Select Document
                          </label>
                        ) : (
                          <>
                            <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.1] w-full">
                              <div className="p-2 bg-white/5 rounded-lg"><FileText size={16} className="text-text-secondary" /></div>
                              <div className="text-left flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                <p className="text-xs text-primary font-mono mt-0.5">Ready</p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-text-dim hover:text-white transition-colors p-1">
                                <ChevronRight size={14} />
                              </button>
                            </div>

                            <div className="flex items-center justify-center gap-3 py-1">
                              <label className="relative flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  id="deep-analysis"
                                  className="peer sr-only"
                                />
                                <div className="w-9 h-5 bg-white/5 border border-white/10 rounded-full peer-checked:bg-primary/20 transition-all" />
                                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white/20 rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-primary" />
                                <span className="text-xs text-text-dim group-hover:text-white transition-colors">
                                  Deep Analysis (GPU)
                                </span>
                              </label>
                            </div>

                            {isAnalyzing && (
                              <div className="w-full space-y-2">
                                <div className="flex justify-between text-xs text-text-dim">
                                  <span>Analyzing...</span>
                                  <span>{analysisProgress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                                  <div
                                    className="h-full primary-gradient transition-all duration-500"
                                    style={{ width: `${analysisProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            <button
                              onClick={analyzeContract}
                              disabled={isAnalyzing}
                              className="w-full py-3 rounded-lg primary-gradient text-white font-semibold text-sm transition-all disabled:opacity-50 hover:brightness-110"
                            >
                              {isAnalyzing ? (
                                <div className="flex items-center justify-center gap-3">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Analyzing...
                                </div>
                              ) : (
                                "Run Audit"
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'overview' && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Risk summary bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Critical', count: result?.reports?.executive_summary?.risk_counts?.critical ?? result?.summary?.critical ?? 0, color: 'text-red-400 bg-red-500/10' },
                    { label: 'High', count: result?.reports?.executive_summary?.risk_counts?.high ?? result?.summary?.high ?? 0, color: 'text-amber-400 bg-amber-500/10' },
                    { label: 'Medium', count: result?.reports?.executive_summary?.risk_counts?.medium ?? result?.summary?.medium ?? 0, color: 'text-indigo-400 bg-indigo-500/10' },
                    { label: 'Low', count: result?.reports?.executive_summary?.risk_counts?.low ?? result?.summary?.low ?? 0, color: 'text-emerald-400 bg-emerald-500/10' },
                  ].map(r => (
                    <div key={r.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]`}>
                      <span className={`text-2xl font-semibold ${r.color.split(' ')[0]}`}>{r.count}</span>
                      <span className="text-xs text-text-dim">{r.label}</span>
                    </div>
                  ))}
                </div>

                {/* Executive headline */}
                {result?.reports?.executive_summary?.headline && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6">
                    <h3 className="text-base font-semibold text-white mb-2">
                      {result.reports.executive_summary.headline}
                    </h3>
                    {(result.reports.executive_summary.top_issues || []).length > 0 && (
                      <ul className="space-y-1.5">
                        {result.reports.executive_summary.top_issues.map((issue: string, i: number) => (
                          <li key={i} className="flex gap-2 text-sm text-text-secondary">
                            <span className="text-text-dim font-mono text-xs mt-0.5">{i + 1}.</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Main clause analysis list */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white">Clause Analysis</h3>
                  <span className="text-xs font-mono text-primary">{result?.risks?.length || 0} issues</span>
                </div>

                <div className="space-y-6">
                  {(result?.risks || []).map((risk: any, rIdx: number) => (
                    <motion.div
                      key={risk.clause_id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: rIdx * 0.04 }}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden"
                    >
                      {/* Clause header */}
                      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.05] bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center text-xs font-mono text-text-dim">{rIdx + 1}</span>
                          <span className="text-sm font-medium text-white">
                            {result.clauses.find((c: any) => c.clause_id === risk.clause_id)?.heading || `Clause ${rIdx + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            risk.severity === 'critical' ? 'bg-red-500/15 text-red-400' :
                            risk.severity === 'high' ? 'bg-amber-500/15 text-amber-400' :
                            risk.severity === 'medium' ? 'bg-indigo-500/15 text-indigo-400' :
                            'bg-emerald-500/15 text-emerald-400'
                          }`}>
                            {risk.severity}
                          </span>
                          <button
                            type="button"
                            onClick={() => collab.togglePin(risk.clause_id)}
                            className={`p-1.5 rounded-md border transition-colors ${
                              collab.isPinned(risk.clause_id)
                                ? 'border-primary/50 bg-primary/10 text-primary'
                                : 'border-white/[0.08] text-text-dim hover:text-white'
                            }`}
                          >
                            <Pin size={12} className={collab.isPinned(risk.clause_id) ? 'fill-current' : ''} />
                          </button>
                        </div>
                      </div>

                      {/* Diff viewer content */}
                      <DiffViewer
                        original={result.clauses.find((c: any) => c.clause_id === risk.clause_id)?.text || ''}
                        proposed={result.redlines?.patches?.find((p: any) => p.clause_id === risk.clause_id)?.patch || 'No changes proposed.'}
                        rationale={risk.rationale}
                      />

                      {/* Scenarios */}
                      {risk.negotiation_scenarios && risk.negotiation_scenarios.length > 0 && (
                        <div className="px-5 py-4 border-t border-white/[0.05] bg-white/[0.01]">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap size={13} className="text-primary" />
                            <span className="text-xs font-semibold text-primary/80 uppercase tracking-wide">Negotiation Scenarios</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {risk.negotiation_scenarios.map((scenario: any) => (
                              <div key={scenario.scenario_id} className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                                <p className="text-sm font-medium text-white mb-1">{scenario.name}</p>
                                <p className="text-xs text-text-dim leading-relaxed mb-2">{scenario.explanation}</p>
                                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs">
                                  <span className="font-mono text-primary">{scenario.probability}%</span>
                                  <span className="font-medium text-white">
                                    {typeof scenario.financial_impact === 'number'
                                      ? `$${scenario.financial_impact.toLocaleString()}`
                                      : '—'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Collaboration & trends at the bottom */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <RiskChart data={result?.reports?.executive_summary?.risk_counts || { critical: 0, high: 0, medium: 0, low: 0 }} />
                  </div>
                  <div className="space-y-4">
                    <RiskTrendSnapshot history={riskHistory} />
                    {result?.case_id && Array.isArray(result.clauses) && (
                      <CaseCollaborationPanel caseId={result.case_id} clauses={result.clauses} />
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'audit' && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-6 rounded-xl"
              >
                {result ? (
                  <ClauseViewer clauses={result.clauses} />
                ) : (
                  <div className="py-16 text-center text-text-dim">
                    <FileText size={40} className="mx-auto mb-4 opacity-40" />
                    <p className="text-base font-semibold mb-1">No Document Loaded</p>
                    <p className="text-sm">Upload a document to view segmented clauses.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'vector' && (
              <motion.div
                key="vector"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-6 rounded-xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Database size={20} className="text-primary" />
                  <h2 className="text-lg font-semibold">Vector Storage</h2>
                </div>
                {(() => {
                  const vs = result?.vectorStats;
                  const docCount = vs?.documentCount ?? 0;
                  const isReady = vs?.isReady ?? false;
                  const clauseCount = result?.clauses?.length ?? 0;
                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                          <p className="text-xs uppercase tracking-wide text-text-dim mb-1">Engine</p>
                          <p className="text-lg font-semibold font-mono">In-Memory</p>
                        </div>
                        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                          <p className="text-xs uppercase tracking-wide text-text-dim mb-1">Embeddings</p>
                          <p className={`text-lg font-semibold ${isReady ? 'text-success' : 'text-text-dim'}`}>{isReady ? 'Active' : 'Idle'}</p>
                        </div>
                        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                          <p className="text-xs uppercase tracking-wide text-text-dim mb-1">Indexed Chunks</p>
                          <p className="text-lg font-semibold font-mono">{docCount}</p>
                        </div>
                        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                          <p className="text-xs uppercase tracking-wide text-text-dim mb-1">Clauses Analyzed</p>
                          <p className="text-lg font-semibold font-mono">{clauseCount}</p>
                        </div>
                      </div>
                      {!result ? (
                        <div className="mt-6 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] text-text-dim text-sm">
                          Upload and analyze a document to populate the vector store.
                        </div>
                      ) : (
                        <div className="mt-6 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] text-text-dim text-sm">
                          {docCount > 0
                            ? `${docCount} document chunks indexed using OpenAI text-embedding-3-small. Semantic search is available for clause retrieval.`
                            : 'Embedding failed or was skipped. Clause analysis still completed using direct LLM calls.'}
                        </div>
                      )}
                    </>
                  );
                })()}
              </motion.div>
            )}

            {activeTab === 'intelligence' && (
              <motion.div
                key="intelligence"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AgentLogs logs={result?.logs || []} />
                  <PerformanceDashboard />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <NegotiationModal
        isOpen={negotiationState.isOpen}
        onClose={() => setNegotiationState(prev => ({ ...prev, isOpen: false }))}
        clause={negotiationState.clause}
        scenario={negotiationState.scenario}
      />
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center text-text-dim">Loading workspace...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
