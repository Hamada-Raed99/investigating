/**
 * Main game layout: orchestrates level data, evidence viewer, notebook, and accusation flow.
 */

import { useCallback, useEffect, useState } from 'react';
import { Fingerprint, Gavel, Loader2, Shield } from 'lucide-react';
import { AccusationPanel } from '@/components/AccusationPanel';
import { EvidenceViewer } from '@/components/EvidenceViewer';
import { Notebook } from '@/components/Notebook';
import {
  createPinnedSnippet,
  loadNotebook,
  saveNotebook,
} from '@/lib/notebookStorage';
import { fetchLevelData, verifyAccusation } from '@/services/levelService';
import type {
  AccusationSubmission,
  LevelData,
  NotebookState,
  TextSelectionPayload,
} from '@/types/game';

interface GameDashboardProps {
  levelNumber?: number;
}

export function GameDashboard({ levelNumber = 1 }: GameDashboardProps) {
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [notebook, setNotebook] = useState<NotebookState>({
    freeformNotes: '',
    pinnedSnippets: [],
  });
  const [isAccusationOpen, setIsAccusationOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLevel() {
      setLoading(true);
      setLoadError(null);

      try {
        const data = await fetchLevelData(levelNumber);
        if (cancelled) return;

        setLevelData(data);
        setSelectedEvidenceId(data.evidence[0]?.id ?? null);
        setNotebook(loadNotebook(data.level.id));
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : 'Failed to load level data.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLevel();
    return () => {
      cancelled = true;
    };
  }, [levelNumber]);

  useEffect(() => {
    if (!levelData) return;
    saveNotebook(levelData.level.id, notebook);
  }, [levelData, notebook]);

  const handleNotesChange = useCallback((notes: string) => {
    setNotebook((prev) => ({ ...prev, freeformNotes: notes }));
  }, []);

  const handlePinSelection = useCallback((payload: TextSelectionPayload) => {
    setNotebook((prev) => ({
      ...prev,
      pinnedSnippets: [
        createPinnedSnippet(payload.text, payload.sourceTitle),
        ...prev.pinnedSnippets,
      ],
    }));
  }, []);

  const handleRemoveSnippet = useCallback((snippetId: string) => {
    setNotebook((prev) => ({
      ...prev,
      pinnedSnippets: prev.pinnedSnippets.filter((s) => s.id !== snippetId),
    }));
  }, []);

  const handleAccusationSubmit = useCallback(
    async (submission: AccusationSubmission) => {
      if (!levelData) {
        throw new Error('Level data not loaded.');
      }
      return verifyAccusation(levelData.level.id, submission);
    },
    [levelData],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e14] text-slate-400">
        <div className="flex items-center gap-3 font-mono text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
          Initializing case workstation...
        </div>
      </div>
    );
  }

  if (loadError || !levelData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e14] p-6">
        <div className="max-w-md rounded-lg border border-red-800/50 bg-red-950/20 p-6 text-center">
          <p className="font-mono text-sm text-red-300">
            {loadError ?? 'Unable to load case files.'}
          </p>
        </div>
      </div>
    );
  }

  const { level, suspects, evidence, accusationConfig } = levelData;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0e14] text-slate-200">
      <header className="shrink-0 border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-800/50 bg-cyan-950/40">
              <Fingerprint className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                Case Workstation · Level {level.level_number}
              </p>
              <h1 className="text-base font-semibold text-slate-100 sm:text-lg">
                {level.title}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAccusationOpen(true)}
            className="flex items-center gap-2 rounded-md border border-red-800/60 bg-red-950/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-red-200 transition hover:border-red-600 hover:bg-red-900/50 sm:px-4 sm:text-sm sm:normal-case sm:tracking-normal"
          >
            <Gavel className="h-4 w-4" />
            <span className="hidden sm:inline">File Accusation</span>
            <span className="sm:hidden">Accuse</span>
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 rounded-lg border border-slate-800/80 bg-slate-900/40 px-4 py-3">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
              {level.description}
            </p>
          </div>
        </div>

        <div className="grid h-[calc(100vh-13rem)] min-h-[520px] grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
          <EvidenceViewer
            evidence={evidence}
            selectedEvidenceId={selectedEvidenceId}
            onSelectEvidence={setSelectedEvidenceId}
            onPinSelection={handlePinSelection}
          />
          <Notebook
            notebook={notebook}
            onNotesChange={handleNotesChange}
            onRemoveSnippet={handleRemoveSnippet}
          />
        </div>

        <aside className="mt-4 rounded-lg border border-slate-800/80 bg-slate-900/30 px-4 py-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Persons of Interest
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {suspects.map((suspect) => (
              <article
                key={suspect.id}
                className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2.5"
              >
                <h3 className="text-sm font-medium text-slate-200">{suspect.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {suspect.description}
                </p>
              </article>
            ))}
          </div>
        </aside>
      </div>

      <AccusationPanel
        isOpen={isAccusationOpen}
        suspects={suspects}
        evidence={evidence}
        motiveOptions={accusationConfig.motive_options}
        onClose={() => setIsAccusationOpen(false)}
        onSubmit={handleAccusationSubmit}
      />
    </div>
  );
}
