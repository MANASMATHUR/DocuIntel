'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, FileText, ChevronDown, ChevronUp, Terminal, BookOpen, Layers } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Clause {
  clause_id: string
  heading: string
  body: string
  source_document?: string
}

interface ClauseViewerProps {
  clauses: Clause[]
}

export default function ClauseViewer({ clauses }: ClauseViewerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(() => {
    // Safely initialize with first clause ID, or empty set if no clauses
    if (clauses && clauses.length > 0 && clauses[0]?.clause_id) {
      return new Set([clauses[0].clause_id])
    }
    return new Set()
  })

  const filteredClauses = useMemo(() => {
    if (!clauses || !Array.isArray(clauses)) {
      return []
    }
    return clauses.filter(clause => {
      const matchesSearch = clause.heading?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clause.body?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [clauses, searchQuery])

  const toggleClause = (clauseId: string) => {
    setExpandedClauses(prev => {
      const next = new Set(prev)
      if (next.has(clauseId)) {
        next.delete(clauseId)
      } else {
        next.add(clauseId)
      }
      return next
    })
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <BookOpen size={18} className="text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Clause Repository</h2>
            <p className="text-xs text-text-dim">{clauses?.length || 0} clauses found</p>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search clauses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/30 transition-all"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredClauses.map((clause, index) => {
          const isExpanded = expandedClauses.has(clause.clause_id)
          return (
            <motion.div
              key={clause.clause_id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`glass-card rounded-xl overflow-hidden transition-all ${isExpanded ? 'border-primary/20' : 'border-[var(--border)]'}`}
            >
              <div
                className="px-5 py-3.5 cursor-pointer flex justify-between items-center group hover:bg-[var(--bg-card)] transition-colors"
                onClick={() => toggleClause(clause.clause_id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-primary text-[var(--text-inverse)]' : 'bg-white/5 text-text-dim'}`}>
                    <Terminal size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-primary">Clause {index + 1}</span>
                    <h3 className="text-sm font-medium text-[var(--text)] group-hover:text-primary transition-colors">
                      {clause.heading || 'Untitled Clause'}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {clause.source_document && (
                    <span className="hidden lg:inline text-xs text-text-dim">{clause.source_document}</span>
                  )}
                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary' : 'text-text-dim'}`}>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 py-4 border-t border-[var(--border)] bg-white/[0.01]">
                      <p className="text-sm text-text-secondary leading-relaxed font-mono">
                        {clause.body || "No clause content available."}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
        {filteredClauses.length === 0 && (
          <div className="py-12 flex flex-col items-center text-center text-text-dim">
            <Search size={24} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">No Results Found</p>
            <p className="text-xs">Try different search terms.</p>
          </div>
        )}
      </div>
    </div>
  )
}
