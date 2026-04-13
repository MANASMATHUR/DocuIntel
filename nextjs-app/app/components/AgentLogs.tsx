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
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <Terminal size={18} className="text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-white">System Console</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-text-dim">Active</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-text-dim">Steps</span>
            <span className="text-sm font-mono text-white">{logs.length}</span>
          </div>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-purple-400">Reasoning</span>
            <span className="text-sm font-mono text-purple-400">{logs.filter(l => l.role === 'react_worker').length}</span>
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
              className={`p-4 rounded-xl border transition-all group overflow-hidden ${log.role === 'react_worker' ? 'bg-purple-500/[0.03] border-purple-500/15' : 'bg-white/[0.02] border-white/[0.06] hover:border-primary/20'}`}
            >
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {getStatusIcon(log.status, log.role)}
                    <span className={`text-xs font-semibold uppercase ${log.role === 'react_worker' ? 'text-purple-400' :
                      log.role === 'graph_rag' ? 'text-cyan-400' : 'text-primary'
                      }`}>{log.role.replace('_', ' ')}</span>
                    <span className="text-xs font-medium text-white truncate">{log.task}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {log.method && (
                      <span className="text-[10px] font-medium text-emerald-400 px-1.5 py-0.5 bg-emerald-500/10 rounded">{log.method}</span>
                    )}
                    <span className="text-[10px] font-mono text-text-dim">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-2.5 py-1 bg-white/[0.03] border border-white/[0.05] rounded-md w-fit">
                  <Cpu size={10} className="text-text-dim" />
                  <span className="text-xs font-mono text-text-secondary">{log.model}</span>
                </div>

                {log.thought && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <BrainCircuit size={12} className="text-purple-400/60" />
                      <span className="text-xs font-medium text-purple-400/60">Reasoning</span>
                    </div>
                    <div className="p-3 bg-purple-500/[0.04] rounded-lg border border-purple-500/10 text-xs text-purple-200/80 leading-relaxed">
                      {log.thought}
                    </div>
                  </div>
                )}

                {log.result_preview && (
                  <pre className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05] text-xs text-text-secondary font-mono leading-relaxed whitespace-pre-wrap">
                    {log.result_preview}
                  </pre>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-30">
            <Activity size={28} className="text-text-dim mb-3" />
            <p className="text-sm font-medium text-primary mb-1">Ready</p>
            <p className="text-xs text-text-dim">Waiting for analysis input</p>
          </div>
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  )
}
