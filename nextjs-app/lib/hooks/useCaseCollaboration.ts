'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type CollabNote = { id: string; text: string; at: string };

export type CaseCollaborationState = {
  assignedTo: string;
  dueDate: string;
  notes: CollabNote[];
  pinnedClauseIds: string[];
};

const defaultState: CaseCollaborationState = {
  assignedTo: '',
  dueDate: '',
  notes: [],
  pinnedClauseIds: [],
};

function storageKey(caseId: string) {
  return `case_collab_${caseId}`;
}

export function useCaseCollaboration(caseId: string | null) {
  const [state, setState] = useState<CaseCollaborationState>(defaultState);

  useEffect(() => {
    if (!caseId || typeof window === 'undefined') {
      setState(defaultState);
      return;
    }
    try {
      const raw = window.localStorage.getItem(storageKey(caseId));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CaseCollaborationState>;
        setState({
          assignedTo: typeof parsed.assignedTo === 'string' ? parsed.assignedTo : '',
          dueDate: typeof parsed.dueDate === 'string' ? parsed.dueDate : '',
          notes: Array.isArray(parsed.notes) ? parsed.notes : [],
          pinnedClauseIds: Array.isArray(parsed.pinnedClauseIds) ? parsed.pinnedClauseIds : [],
        });
      } else {
        setState(defaultState);
      }
    } catch {
      setState(defaultState);
    }
  }, [caseId]);

  useEffect(() => {
    if (!caseId || typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey(caseId), JSON.stringify(state));
  }, [caseId, state]);

  const setAssignedTo = useCallback((v: string) => {
    setState((s) => ({ ...s, assignedTo: v }));
  }, []);

  const setDueDate = useCallback((v: string) => {
    setState((s) => ({ ...s, dueDate: v }));
  }, []);

  const addNote = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const note: CollabNote = {
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      at: new Date().toISOString(),
    };
    setState((s) => ({ ...s, notes: [note, ...s.notes] }));
  }, []);

  const removeNote = useCallback((id: string) => {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  }, []);

  const togglePin = useCallback((clauseId: string) => {
    setState((s) => {
      const has = s.pinnedClauseIds.includes(clauseId);
      return {
        ...s,
        pinnedClauseIds: has
          ? s.pinnedClauseIds.filter((id) => id !== clauseId)
          : [...s.pinnedClauseIds, clauseId],
      };
    });
  }, []);

  const isPinned = useCallback(
    (clauseId: string) => state.pinnedClauseIds.includes(clauseId),
    [state.pinnedClauseIds]
  );

  return useMemo(
    () => ({
      ...state,
      setAssignedTo,
      setDueDate,
      addNote,
      removeNote,
      togglePin,
      isPinned,
    }),
    [state, setAssignedTo, setDueDate, addNote, removeNote, togglePin, isPinned]
  );
}
