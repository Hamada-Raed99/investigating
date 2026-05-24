/**
 * Persistent investigator notepad: free-form notes plus pinned evidence snippets.
 */

import { BookOpen, Pin, Trash2 } from 'lucide-react';
import type { NotebookState, PinnedSnippet } from '@/types/game';

interface NotebookProps {
  notebook: NotebookState;
  onNotesChange: (notes: string) => void;
  onRemoveSnippet: (snippetId: string) => void;
}

function formatPinnedTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function PinnedSnippetCard({
  snippet,
  onRemove,
}: {
  snippet: PinnedSnippet;
  onRemove: (id: string) => void;
}) {
  return (
    <article className="group rounded-md border border-amber-900/40 bg-amber-950/20 p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-500/90">
          <Pin className="h-3 w-3" />
          {snippet.sourceTitle}
        </div>
        <button
          type="button"
          onClick={() => onRemove(snippet.id)}
          className="rounded p-1 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-slate-800 hover:text-red-400"
          aria-label="Remove pinned snippet"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <blockquote className="border-l-2 border-amber-600/50 pl-3 text-xs leading-relaxed text-amber-100/90">
        {snippet.text}
      </blockquote>
      <p className="mt-2 font-mono text-[10px] text-slate-600">
        Pinned {formatPinnedTime(snippet.pinnedAt)}
      </p>
    </article>
  );
}

export function Notebook({ notebook, onNotesChange, onRemoveSnippet }: NotebookProps) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-slate-700/80 bg-slate-900/60">
      <header className="border-b border-slate-700/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-cyan-400/80" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Field Notes
            </p>
            <h2 className="text-sm font-semibold text-slate-100">Investigator Notebook</h2>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div>
          <label
            htmlFor="freeform-notes"
            className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-slate-500"
          >
            Observations
          </label>
          <textarea
            id="freeform-notes"
            value={notebook.freeformNotes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Record theories, timelines, contradictions..."
            className="min-h-[120px] w-full resize-y rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 font-mono text-xs leading-relaxed text-slate-200 placeholder:text-slate-600 focus:border-cyan-600/60 focus:outline-none focus:ring-1 focus:ring-cyan-600/40"
          />
        </div>

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Pinned Evidence ({notebook.pinnedSnippets.length})
          </p>

          {notebook.pinnedSnippets.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-700/80 px-3 py-6 text-center text-xs text-slate-500">
              Highlight text in Case Files and click &ldquo;Pin to Notebook&rdquo;
            </p>
          ) : (
            <div className="space-y-3">
              {notebook.pinnedSnippets.map((snippet) => (
                <PinnedSnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  onRemove={onRemoveSnippet}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
