/**
 * Persists notebook state to localStorage per level.
 * Future: sync to player_notebooks table when auth is added.
 */

import type { NotebookState, PinnedSnippet } from '@/types/game';

const STORAGE_PREFIX = 'investigating:notebook:';

function storageKey(levelId: string): string {
  return `${STORAGE_PREFIX}${levelId}`;
}

const EMPTY_NOTEBOOK: NotebookState = {
  freeformNotes: '',
  pinnedSnippets: [],
};

export function loadNotebook(levelId: string): NotebookState {
  try {
    const raw = localStorage.getItem(storageKey(levelId));
    if (!raw) return { ...EMPTY_NOTEBOOK };
    return JSON.parse(raw) as NotebookState;
  } catch {
    return { ...EMPTY_NOTEBOOK };
  }
}

export function saveNotebook(levelId: string, state: NotebookState): void {
  localStorage.setItem(storageKey(levelId), JSON.stringify(state));
}

export function createPinnedSnippet(
  text: string,
  sourceTitle: string,
): PinnedSnippet {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    sourceTitle,
    pinnedAt: new Date().toISOString(),
  };
}
