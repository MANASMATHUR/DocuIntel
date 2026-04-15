'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { DiffViewer } from '@/components/ui/diff-viewer';
import { AnimatePresence } from 'framer-motion';
import { Upload, FileText, Loader2, Download, MessageSquare, Zap, Pin, Link2, ExternalLink, BarChart3, Shield, AlertTriangle, TrendingUp, Clock, Database } from 'lucide-react';
import { NegotiationModal } from '@/components/modals/negotiation-modal';
import AgentLogs from '@/app/components/AgentLogs';
import PerformanceDashboard from '@/app/components/PerformanceDashboard';
import ClauseViewer from '@/app/components/ClauseViewer';
import { useSearchParams } from 'next/navigation';
import { CaseCollaborationPanel } from '@/components/case-collaboration-panel';
import { RiskTrendSnapshot } from '@/components/risk-trend-snapshot';
import { appendRiskSnapshot, loadRiskHistory, type RiskSnapshot } from '@/lib/risk-history';
import { useCaseCollaboration } from '@/lib/hooks/useCaseCollaboration';
import { useUser } from '@/lib/hooks/useUser';

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const { user } = useUser();
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
  const [userStats, setUserStats] = useState<any>(null);
  const [negotiationState, setNegotiationState] = useState<{ isOpen: boolean; clause: string; scenario: any }>({ isOpen: false, clause: '', scenario: null });
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [signModal, setSignModal] = useState<{ open: boolean; title: string; content: string }>({ open: false, title: '', content: '' });
  const [signEmail, setSignEmail] = useState('');
  const [signName, setSignName] = useState('');
  const [signLoading, setSignLoading] = useState(false);
  const [signResult, setSignResult] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setFile(e.target.files[0]); };

  const sendForSignature = async () => {
    if (!signEmail.trim() || !signModal.content) return;
    setSignLoading(true); setSignResult(null);
    try {
      const res = await fetch('/api/integrations/docusign/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: signEmail.trim(),
          recipientName: signName.trim() || signEmail.trim(),
          documentTitle: signModal.title,
          documentContent: signModal.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSignResult(data.error || 'Failed to send'); return; }
      setSignResult(`Sent to ${signEmail} for signature.`);
      setTimeout(() => { setSignModal({ open: false, title: '', content: '' }); setSignEmail(''); setSignName(''); setSignResult(null); }, 3000);
    } catch { setSignResult('Failed to send. Check your DocuSign connection.'); }
    finally { setSignLoading(false); }
  };

  const loadDriveFiles = async () => {
    setDriveLoading(true);
    try {
      const res = await fetch('/api/integrations/google/files');
      const data = await res.json();
      if (data.error) {
        // Not connected - redirect to OAuth
        window.location.href = '/api/integrations/google/connect';
        return;
      }
      setDriveFiles(data.files || []);
      setShowDrivePicker(true);
    } catch {
      window.location.href = '/api/integrations/google/connect';
    } finally { setDriveLoading(false); }
  };

  const importFromDrive = async (driveFile: any) => {
    setShowDrivePicker(false);
    try {
      const res = await fetch(`/api/integrations/google/files?download=${encodeURIComponent(driveFile.id)}`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const f = new File([blob], driveFile.name, { type: driveFile.mimeType || 'application/octet-stream' });
      setFile(f);
    } catch {
      setAnalysisNotice('Failed to import file from Google Drive.');
    }
  };

  useEffect(() => {
    const caseId = searchParams.get('case_id');
    if (!caseId) return;
    (async () => {
      try {
        const res = await fetch(`/api/cases?case_id=${encodeURIComponent(caseId)}`);
        if (!res.ok) return;
        const data = await res.json();
        setResult(data);
        setActiveTab('overview');
        if (data.analysis_meta?.fallbackUsed) setAnalysisNotice('Standard analysis was used (GPU backend unavailable).');
      } catch {}
    })();
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => { if (data.user?.stats) setUserStats(data.user.stats); }).catch(() => {});
  }, [result]);

  const collab = useCaseCollaboration(result?.case_id ?? null);
  const riskCountsKey = useMemo(() => JSON.stringify(result?.reports?.executive_summary?.risk_counts || result?.summary || {}), [result?.reports?.executive_summary?.risk_counts, result?.summary]);

  useEffect(() => {
    if (!result?.case_id) { setRiskHistory([]); return; }
    const rc = result.reports?.executive_summary?.risk_counts || result.summary || {};
    const next = appendRiskSnapshot(result.case_id, { critical: Number(rc.critical) || 0, high: Number(rc.high) || 0, medium: Number(rc.medium) || 0, low: Number(rc.low) || 0 });
    setRiskHistory(next.length ? next : loadRiskHistory(result.case_id));
  }, [result?.case_id, riskCountsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const analyzeContract = async () => {
    if (!file) return;
    setIsAnalyzing(true); setAnalysisProgress(0);
    const formData = new FormData();
    formData.append('primary_docs', file);
    formData.append('instructions', 'Strict liability caps and mutual indemnification');
    const iv = setInterval(() => setAnalysisProgress(p => Math.min(p + 8, 90)), 800);
    try {
      const res = await fetch('/api/cases', { method: 'POST', body: formData });
      clearInterval(iv); setAnalysisProgress(100);
      const data = await res.json();
      if (!res.ok) { setAnalysisNotice(data.error || 'Analysis failed.'); return; }
      setResult(data);
      setAnalysisNotice(data.analysis_meta?.fallbackUsed ? 'Standard analysis was used.' : null);
    } catch { clearInterval(iv); setAnalysisNotice('Analysis failed.'); }
    finally { setIsAnalyzing(false); setAnalysisProgress(0); }
  };

  const exportReport = async (format: 'txt' | 'html' = 'txt') => {
    if (!result) return; setIsExporting(true);
    try {
      const res = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseData: result, format }) });
      const blob = await res.blob(); const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `DocuIntel_Report_${result.case_id}.${format}`;
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url);
    } catch {} finally { setIsExporting(false); }
  };

  const openExecutiveReport = async () => {
    if (!result) return; setShareBusy(true); setShareToast(null);
    try {
      const res = await fetch('/api/reports/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseData: result }) });
      if (!res.ok) throw new Error(); const { path } = await res.json();
      window.open(`${window.location.origin}${path}`, '_blank', 'noopener,noreferrer');
    } catch { setShareToast('Could not open report.'); }
    finally { setShareBusy(false); }
  };

  const startNegotiation = () => {
    if (!result?.risks?.length) return;
    const tr = result.risks.find((r: any) => r.severity === 'critical') || result.risks[0];
    const tc = result.clauses.find((c: any) => c.clause_id === tr.clause_id);
    setNegotiationState({ isOpen: true, clause: tc?.text || '', scenario: tr.negotiation_scenarios?.[0] || { name: 'Contract Review', explanation: 'Negotiation for risk mitigation.' } });
  };

  const summary = result?.summary || result?.reports?.executive_summary?.risk_counts || {};
  const topRisks = (result?.risks || []).filter((r: any) => r.severity === 'critical' || r.severity === 'high').slice(0, 4);

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="max-w-[1100px] mx-auto">

        {/* Gazette Masthead */}
        <div className="text-center mb-6 pb-4" style={{ borderBottom: '3px solid var(--text)' }}>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
            The DocuIntel Gazette
          </h1>
          <p className="gazette-label mt-2">Contract Intelligence · Risk Analysis · Legal Workflow</p>
        </div>

        {/* Stats Bar */}
        {userStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-6 border" style={{ borderColor: 'var(--border)', background: 'var(--border)' }}>
            {[
              { icon: FolderOpen, val: userStats.casesAnalyzed || 0, label: 'Cases Filed', sub: `${userStats.analysesThisMonth || 0} this month` },
              { icon: AlertTriangle, val: userStats.criticalRisksFound || 0, label: 'Critical Risks', sub: 'across all cases' },
              { icon: FileText, val: userStats.clausesReviewed || 0, label: 'Clauses Reviewed', sub: 'total analyzed' },
              { icon: Clock, val: result ? `${((result.logs || []).length)}` : '0', label: 'Pipeline Steps', sub: 'last analysis' },
            ].map((s, i) => (
              <div key={i} className="p-5" style={{ background: 'var(--bg-card)' }}>
                <div className="flex items-start justify-between mb-2">
                  <s.icon size={16} style={{ color: 'var(--text-dim)' }} />
                  <TrendingUp size={14} style={{ color: 'var(--text-dim)' }} />
                </div>
                <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>{s.val}</p>
                <p className="text-xs font-semibold mt-1">{s.label}</p>
                <p className="gazette-label mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        <hr className="mb-6" style={{ border: 'none', borderTop: '3px solid var(--text)' }} />

        {/* Notices */}
        {analysisNotice && <div className="mb-4 px-4 py-3 border text-sm" style={{ borderColor: 'var(--accent)', background: 'rgba(192,120,48,0.08)', color: 'var(--accent-dark)' }}>{analysisNotice}</div>}
        {shareToast && <div className="mb-4 px-4 py-3 border text-sm" style={{ borderColor: 'var(--border)' }}>{shareToast}</div>}

        <AnimatePresence mode="wait">
          {/* OVERVIEW - No Result */}
          {activeTab === 'overview' && !result && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
              {/* File New Brief */}
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-serif)' }}>File New Brief</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>Submit a contract for immediate analysis by the editorial board.</p>

                <input type="file" onChange={handleUpload} className="hidden" id="file-upload" accept=".pdf,.docx,.txt" />

                {!file && !showDrivePicker ? (
                  <div className="space-y-3">
                    <label htmlFor="file-upload" className="block border-2 border-dashed p-10 text-center cursor-pointer hover:bg-[var(--bg-hover)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                      <Upload size={32} className="mx-auto mb-3" style={{ color: 'var(--text-dim)' }} />
                      <p className="font-bold mb-1" style={{ fontFamily: 'var(--font-serif)' }}>Drop Contract Here</p>
                      <p className="text-xs" style={{ color: 'var(--text-dim)' }}>PDF, DOCX, or TXT</p>
                    </label>
                    <div className="flex items-center gap-3">
                      <hr className="flex-1" style={{ borderColor: 'var(--border)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-dim)' }}>or</span>
                      <hr className="flex-1" style={{ borderColor: 'var(--border)' }} />
                    </div>
                    <button
                      onClick={loadDriveFiles}
                      disabled={driveLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border text-sm font-medium hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {driveLoading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                      Import from Google Drive
                    </button>
                  </div>

                ) : showDrivePicker ? (
                  <div className="border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-serif)' }}>Google Drive Files</span>
                      <button onClick={() => setShowDrivePicker(false)} className="text-xs underline" style={{ color: 'var(--text-dim)' }}>Cancel</button>
                    </div>
                    {driveFiles.length === 0 ? (
                      <div className="p-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>No PDF, DOCX, or TXT files found in your Drive.</div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {driveFiles.map((df: any) => (
                          <button
                            key={df.id}
                            onClick={() => importFromDrive(df)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-subtle)] transition-colors border-b"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            <FileText size={16} style={{ color: 'var(--text-dim)' }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{df.name}</p>
                              <p className="gazette-label">{new Date(df.modifiedTime).toLocaleDateString()}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                      <FileText size={18} style={{ color: 'var(--text-dim)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{file?.name}</p>
                        <p className="gazette-label">Ready for analysis</p>
                      </div>
                      <button onClick={() => setFile(null)} className="text-xs underline" style={{ color: 'var(--text-dim)' }}>Remove</button>
                    </div>

                    {isAnalyzing && (
                      <div>
                        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-dim)' }}><span>Analyzing...</span><span>{analysisProgress}%</span></div>
                        <div className="h-1.5 w-full" style={{ background: 'var(--border)' }}>
                          <div className="h-full transition-all duration-500" style={{ width: `${analysisProgress}%`, background: 'var(--text)' }} />
                        </div>
                      </div>
                    )}

                    <button onClick={analyzeContract} disabled={isAnalyzing} className="px-6 py-3 text-xs font-semibold uppercase tracking-wider disabled:opacity-50 transition-colors" style={{ background: 'var(--text)', color: 'var(--bg)' }}>
                      {isAnalyzing ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Analyzing...</span> : 'Submit for Review'}
                    </button>
                  </div>
                )}
              </div>

              {/* Top Risks Sidebar (from previous cases) */}
              <div className="hidden lg:block border-l pl-8" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Editorial: Top Risks</h3>
                <p className="gazette-label mb-4">Clauses requiring immediate attention</p>
                {topRisks.length > 0 ? topRisks.map((risk: any, i: number) => (
                  <div key={i} className="mb-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
                        {result?.clauses?.find((c: any) => c.clause_id === risk.clause_id)?.heading || `Clause ${i + 1}`}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase" style={{ background: risk.severity === 'critical' ? '#1a1a1a' : 'var(--border)', color: risk.severity === 'critical' ? '#fff' : 'var(--text)' }}>
                        {risk.severity}
                      </span>
                    </div>
                    <p className="gazette-label mb-1">{result?.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{risk.rationale?.slice(0, 120)}</p>
                  </div>
                )) : (
                  <p className="text-xs italic" style={{ color: 'var(--text-dim)' }}>No critical or high risks from your recent analyses.</p>
                )}
              </div>
            </div>
          )}

          {/* OVERVIEW - With Result */}
          {activeTab === 'overview' && result && (
            <div>
              {/* Action bar */}
              <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-lg font-bold mr-auto" style={{ fontFamily: 'var(--font-serif)' }}>
                  Analysis: {result.title || 'Contract'}
                </h2>
                <button onClick={openExecutiveReport} disabled={shareBusy} className="px-3 py-1.5 border text-xs font-medium flex items-center gap-1.5 hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50" style={{ borderColor: 'var(--border)' }}>
                  <ExternalLink size={12} /> Report
                </button>
                <button onClick={() => exportReport('html')} disabled={isExporting} className="px-3 py-1.5 border text-xs font-medium flex items-center gap-1.5 hover:bg-[var(--bg-subtle)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <Download size={12} /> PDF
                </button>
                <button onClick={startNegotiation} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ background: 'var(--text)', color: 'var(--bg)' }}>
                  <MessageSquare size={12} /> Negotiate
                </button>
              </div>

              {/* Risk summary */}
              <div className="grid grid-cols-4 gap-px mb-6 border" style={{ borderColor: 'var(--border)', background: 'var(--border)' }}>
                {[
                  { label: 'Critical', count: summary.critical || 0, bg: '#9b2226' },
                  { label: 'High', count: summary.high || 0, bg: '#bb6b00' },
                  { label: 'Medium', count: summary.medium || 0, bg: '#6B7280' },
                  { label: 'Low', count: summary.low || 0, bg: '#2d6a4f' },
                ].map((r, i) => (
                  <div key={i} className="p-4 text-center" style={{ background: 'var(--bg-card)' }}>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: r.bg }}>{r.count}</p>
                    <p className="gazette-label">{r.label}</p>
                  </div>
                ))}
              </div>

              {/* Headline */}
              {result.reports?.executive_summary?.headline && (
                <div className="mb-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)' }}>{result.reports.executive_summary.headline}</h3>
                  {(result.reports.executive_summary.top_issues || []).map((issue: string, i: number) => (
                    <p key={i} className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{i + 1}. {issue}</p>
                  ))}
                </div>
              )}

              {/* Clause Analysis */}
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Clause-by-Clause Analysis</h3>
              <div className="space-y-4">
                {(result.risks || []).map((risk: any, rIdx: number) => {
                  const clause = result.clauses?.find((c: any) => c.clause_id === risk.clause_id);
                  const patch = result.redlines?.patches?.find((p: any) => p.clause_id === risk.clause_id);
                  return (
                    <div key={risk.clause_id} className="border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>{rIdx + 1}</span>
                          <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-serif)' }}>{clause?.heading || `Clause ${rIdx + 1}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase" style={{ background: risk.severity === 'critical' ? '#9b2226' : risk.severity === 'high' ? '#bb6b00' : 'var(--bg-subtle)', color: risk.severity === 'critical' || risk.severity === 'high' ? '#fff' : 'var(--text)' }}>
                            {risk.severity}
                          </span>
                          <button
                            onClick={() => {
                              const redlineText = patch?.patch || clause?.text || '';
                              setSignModal({ open: true, title: clause?.heading || `Clause ${rIdx + 1}`, content: redlineText });
                            }}
                            className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider border hover:bg-[var(--bg-subtle)] transition-colors"
                            style={{ borderColor: 'var(--border)' }}
                            title="Send for e-signature via DocuSign"
                          >
                            Sign
                          </button>
                          <button onClick={() => collab.togglePin(risk.clause_id)} className="p-1 hover:bg-[var(--bg-subtle)] transition-colors" title="Pin clause">
                            <Pin size={12} style={{ color: collab.isPinned(risk.clause_id) ? 'var(--accent)' : 'var(--text-dim)' }} className={collab.isPinned(risk.clause_id) ? 'fill-current' : ''} />
                          </button>
                        </div>
                      </div>
                      <DiffViewer original={clause?.text || ''} proposed={patch?.patch || 'No changes proposed.'} rationale={risk.rationale} />
                      {risk.negotiation_scenarios?.length > 0 && (
                        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
                          <p className="gazette-label mb-3" style={{ color: 'var(--accent)' }}>Negotiation Scenarios</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {risk.negotiation_scenarios.map((s: any) => (
                              <div key={s.scenario_id} className="p-3 border" style={{ borderColor: 'var(--border)' }}>
                                <p className="text-sm font-semibold mb-1">{s.name}</p>
                                <p className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>{s.explanation}</p>
                                <div className="flex justify-between text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
                                  <span>{s.probability}%</span>
                                  <span>{typeof s.financial_impact === 'number' ? `$${s.financial_impact.toLocaleString()}` : ''}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                  <RiskTrendSnapshot history={riskHistory} />
                </div>
                {result.case_id && Array.isArray(result.clauses) && (
                  <CaseCollaborationPanel caseId={result.case_id} clauses={result.clauses} />
                )}
              </div>
            </div>
          )}

          {/* Other tabs */}
          {activeTab === 'audit' && (
            <div className="border p-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              {result ? <ClauseViewer clauses={result.clauses} /> : (
                <div className="py-12 text-center" style={{ color: 'var(--text-dim)' }}>
                  <FileText size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="font-semibold">No Document Loaded</p>
                  <p className="text-sm">Upload a document to view clauses.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vector' && (
            <div className="border p-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Vector Store</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-px border" style={{ borderColor: 'var(--border)', background: 'var(--border)' }}>
                {[
                  { label: 'Engine', val: 'In-Memory' },
                  { label: 'Embeddings', val: result?.vectorStats?.isReady ? 'Active' : 'Idle' },
                  { label: 'Indexed Chunks', val: result?.vectorStats?.documentCount ?? 0 },
                  { label: 'Clauses', val: result?.clauses?.length ?? 0 },
                ].map((s, i) => (
                  <div key={i} className="p-4" style={{ background: 'var(--bg-card)' }}>
                    <p className="gazette-label mb-1">{s.label}</p>
                    <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-serif)' }}>{s.val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'intelligence' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border p-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                <AgentLogs logs={result?.logs || []} />
              </div>
              <div className="border p-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
                <PerformanceDashboard />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* DocuSign Signature Modal */}
      {signModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-serif)' }}>Send for Signature</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-dim)' }}>Send <strong>{signModal.title}</strong> via DocuSign for e-signature.</p>

            {signResult ? (
              <div className="p-3 border text-sm mb-4" style={{ borderColor: 'var(--accent)', background: 'rgba(192,120,48,0.08)' }}>{signResult}</div>
            ) : (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="gazette-label block mb-1">Recipient Email</label>
                  <input
                    type="email" value={signEmail} onChange={e => setSignEmail(e.target.value)}
                    placeholder="signer@company.com"
                    className="w-full px-3 py-2 border text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <label className="gazette-label block mb-1">Recipient Name (optional)</label>
                  <input
                    type="text" value={signName} onChange={e => setSignName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <label className="gazette-label block mb-1">Document Preview</label>
                  <div className="p-3 border text-xs font-mono max-h-32 overflow-y-auto" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    {signModal.content.slice(0, 500)}{signModal.content.length > 500 ? '...' : ''}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => { setSignModal({ open: false, title: '', content: '' }); setSignResult(null); }} className="px-4 py-2 border text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'var(--border)' }}>
                Cancel
              </button>
              {!signResult && (
                <button onClick={sendForSignature} disabled={signLoading || !signEmail.trim()} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider disabled:opacity-50" style={{ background: 'var(--text)', color: 'var(--bg)' }}>
                  {signLoading ? <span className="flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Sending...</span> : 'Send via DocuSign'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <NegotiationModal isOpen={negotiationState.isOpen} onClose={() => setNegotiationState(p => ({ ...p, isOpen: false }))} clause={negotiationState.clause} scenario={negotiationState.scenario} />
    </DashboardLayout>
  );
}

function FolderOpen(props: any) { return <FileText {...props} />; }

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--text-dim)' }}>Loading workspace...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
