'use client'

import { useEffect, useRef } from 'react'
import { Clock, CheckCircle, XCircle, Loader, Terminal, Cpu, Database, BrainCircuit, Activity, Zap, Layers } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LogEntry {
  task: string
  role: string
  model: string
  prompt?: string
  result_preview?: string
  timestamp: number
  status?: 'completed' | 'failed' | 'pending'
  // Support for ReAct / Advanced flow
  thought?: string
  action?: string
  payload?: any
  method?: string
}

interface AgentLogsProps {
  logs: LogEntry[]
}

export default function AgentLogs({ logs }: AgentLogsProps) {
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getStatusIcon = (status?: string, role?: string) => {
    if (role === 'react_worker') return <BrainCircuit size={16} className="text-purple-400" />
    if (role === 'graph_rag') return <Layers size={16} className="text-cyan-400" />

    switch (status) {
      case 'completed':
        return <CheckCircle size={14} className="text-emerald-400" />
      case 'failed':
        return <XCircle size={14} className="text-rose-400" />
      default:
        return <Loader size={14} className="text-indigo-400 animate-spin" />
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString()
  }

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.05] pb-6 px-2">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            <Terminal size={18} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-['Outfit'] text-white tracking-tight">System Console</h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest">Advanced Pipeline // Active</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-xl backdrop-blur-sm">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Steps</span>
            <span className="text-sm font-mono text-white text-center">{logs.length}</span>
          </div>
          <div className="w-[1px] h-6 bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Reasoning</span>
            <span className="text-sm font-mono text-purple-400 text-center">{logs.filter(l => l.role === 'react_worker').length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
        <AnimatePresence>
          {logs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-5 glass-card border-white/[0.05] hover:border-indigo-500/30 transition-all group overflow-hidden ${log.role === 'react_worker' ? 'bg-indigo-500/[0.03] border-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]' : 'bg-white/[0.01]'
                }`}
            >
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.status, log.role)}
                    <span className={`text-[10px] font-black uppercase tracking-widest border-r border-white/10 pr-3 ${log.role === 'react_worker' ? 'text-purple-400' :
                      log.role === 'graph_rag' ? 'text-cyan-400' : 'text-indigo-400'
                      }`}>{log.role.replace('_', ' ')}</span>
                    <span className="text-xs font-bold text-white tracking-tight">{log.task}</span>
                  </div>
                  {log.method && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <Zap size={10} className="text-emerald-400" />
                      <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">{log.method}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-text-dim uppercase">
                    <Clock size={10} /> {formatTimestamp(log.timestamp)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.02] border border-white/[0.05] rounded-lg">
                    <Cpu size={10} className="text-text-dim transition-colors group-hover:text-indigo-400" />
                    <span className="text-[10px] font-mono text-text-secondary">{log.model}</span>
                  </div>
                </div>

                {log.thought && (
                  <div className="group/thought">
                    <div className="flex items-center gap-2 mb-2">
                      <BrainCircuit size={12} className="text-purple-400/60" />
                      <span className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest">Chain of Thought</span>
                    </div>
                    <div className="p-4 bg-purple-500/[0.03] rounded-2xl border border-purple-500/10 text-xs text-purple-200/80 italic leading-relaxed">
                      {log.thought}
                    </div>
                  </div>
                )}

                {log.result_preview && (
                  <div className="relative">
                    <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Database size={24} className="text-indigo-400" />
                    </div>
                    <pre className="p-4 bg-slate-950/40 rounded-2xl border border-white/[0.03] text-[10px] text-text-secondary font-mono leading-relaxed whitespace-pre-wrap">
                      {log.result_preview}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-30 text-center py-20">
            <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
              <Activity size={32} className="text-text-dim" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">System Standby</p>
              <p className="text-[10px] font-mono tracking-tight text-text-dim">Waiting for input stream // TCP_ESTABLISHED</p>
            </div>
          </div>
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  )
}
