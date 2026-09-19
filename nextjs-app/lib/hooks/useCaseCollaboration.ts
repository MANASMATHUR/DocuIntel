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

async function loadCollaboration(caseId: string): Promise<CaseCollaborationState> {
  const res = await fetch(`/api/cases?case_id=${encodeURIComponent(caseId)}`);
  if (!res.ok) return defaultState;
  const data = await res.json();
  const collab = data.collaboration;
  if (!collab) return defaultState;
  return {
    assignedTo: collab.assignedTo || '',
    dueDate: collab.dueDate || '',
    notes: Array.isArray(collab.notes) ? collab.notes : [],
    pinnedClauseIds: Array.isArray(collab.pinnedClauseIds) ? collab.pinnedClauseIds : [],
  };
}

async function saveCollaboration(caseId: string, state: CaseCollaborationState) {
  await fetch('/api/cases', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId, collaboration: state }),
  });
}

export function useCaseCollaboration(caseId: string | null) {
  const [state, setState] = useState<CaseCollaborationState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!caseId) {
      setState(defaultState);
      setLoaded(false);
      return;
    }
    loadCollaboration(caseId).then((data) => {
      setState(data);
      setLoaded(true);
    });
  }, [caseId]);

  useEffect(() => {
    if (!caseId || !loaded) return;
    const timer = setTimeout(() => {
      saveCollaboration(caseId, state);
    }, 500);
    return () => clearTimeout(timer);
  }, [caseId, state, loaded]);

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
