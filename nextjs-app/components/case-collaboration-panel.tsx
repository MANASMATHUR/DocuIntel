'use client';

import { useState } from 'react';
import { User, Calendar, Pin, StickyNote, Trash2 } from 'lucide-react';
import { useCaseCollaboration } from '@/lib/hooks/useCaseCollaboration';

type Props = {
  caseId: string;
  clauses: Array<{ clause_id: string; text?: string }>;
};

export function CaseCollaborationPanel({ caseId, clauses }: Props) {
  const collab = useCaseCollaboration(caseId);
  const [draft, setDraft] = useState('');

  const pinnedClauses = clauses.filter((c) => collab.pinnedClauseIds.includes(c.clause_id));

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-accent uppercase tracking-wide">Collaboration</span>
        <Pin size={13} className="text-text-dim" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-text-dim flex items-center gap-1.5">
            <User size={11} /> Assigned to
          </label>
          <input
            type="text"
            value={collab.assignedTo}
            onChange={(e) => collab.setAssignedTo(e.target.value)}
            placeholder="Name or team"
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-primary/40"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-text-dim flex items-center gap-1.5">
            <Calendar size={11} /> Due date
          </label>
          <input
            type="date"
            value={collab.dueDate}
            onChange={(e) => collab.setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-primary/40"
          />
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs text-text-dim flex items-center gap-1.5">
          <StickyNote size={11} /> Notes
        </span>
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Add a note..."
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-primary/40 resize-none"
          />
          <button
            type="button"
            onClick={() => {
              collab.addNote(draft);
              setDraft('');
            }}
            className="px-3 py-2 rounded-lg bg-primary/20 border border-primary/30 text-xs font-medium text-primary hover:bg-primary/30 self-end"
          >
            Add
          </button>
        </div>
        {collab.notes.length > 0 && (
          <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {collab.notes.map((n) => (
              <li
                key={n.id}
                className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-text-secondary relative group"
              >
                <p className="pr-6">{n.text}</p>
                <p className="text-[10px] text-text-dim mt-1 font-mono">
                  {new Date(n.at).toLocaleString()}
                </p>
                <button
                  type="button"
                  onClick={() => collab.removeNote(n.id)}
                  className="absolute top-2 right-2 p-1 rounded text-text-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove note"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pinnedClauses.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-primary font-medium">Pinned clauses</span>
          <ul className="space-y-2">
            {pinnedClauses.map((c) => (
              <li
                key={c.clause_id}
                className="text-xs text-text-secondary p-3 rounded-lg border border-primary/20 bg-primary/5 line-clamp-3"
              >
                {c.text?.slice(0, 200)}
                {(c.text?.length || 0) > 200 ? '...' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
