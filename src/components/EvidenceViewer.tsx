/**
 * Renders case file documents with text selection and pin-to-notebook support.
 * Designed to extend for image/video evidence types in future levels.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Image, Pin, Video } from 'lucide-react';
import type { Evidence, TextSelectionPayload } from '@/types/game';

interface EvidenceViewerProps {
  evidence: Evidence[];
  selectedEvidenceId: string | null;
  onSelectEvidence: (id: string) => void;
  onPinSelection: (payload: TextSelectionPayload) => void;
}

function EvidenceTypeIcon({ type }: { type: Evidence['type'] }) {
  switch (type) {
    case 'image':
      return <Image className="h-4 w-4 shrink-0 text-amber-400/80" aria-hidden />;
    case 'video':
      return <Video className="h-4 w-4 shrink-0 text-sky-400/80" aria-hidden />;
    default:
      return <FileText className="h-4 w-4 shrink-0 text-emerald-400/80" aria-hidden />;
  }
}

export function EvidenceViewer({
  evidence,
  selectedEvidenceId,
  onSelectEvidence,
  onPinSelection,
}: EvidenceViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<TextSelectionPayload | null>(null);
  const [pinButtonPos, setPinButtonPos] = useState<{ top: number; left: number } | null>(null);

  const activeEvidence =
    evidence.find((item) => item.id === selectedEvidenceId) ?? evidence[0] ?? null;

  const clearSelection = useCallback(() => {
    setSelection(null);
    setPinButtonPos(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleMouseUp = useCallback(() => {
    const selectedText = window.getSelection()?.toString().trim();
    if (!selectedText || !activeEvidence || activeEvidence.type !== 'text') {
      clearSelection();
      return;
    }

    const range = window.getSelection()?.getRangeAt(0);
    const container = contentRef.current;
    if (!range || !container || !container.contains(range.commonAncestorContainer)) {
      clearSelection();
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setSelection({
      text: selectedText,
      sourceTitle: activeEvidence.title,
    });
    setPinButtonPos({
      top: rect.bottom - containerRect.top + 8,
      left: Math.min(
        rect.left - containerRect.left,
        containerRect.width - 160,
      ),
    });
  }, [activeEvidence, clearSelection]);

  const handlePin = useCallback(() => {
    if (!selection) return;
    onPinSelection(selection);
    clearSelection();
  }, [clearSelection, onPinSelection, selection]);

  useEffect(() => {
    if (!selectedEvidenceId && evidence.length > 0) {
      onSelectEvidence(evidence[0].id);
    }
  }, [evidence, onSelectEvidence, selectedEvidenceId]);

  useEffect(() => {
    clearSelection();
  }, [activeEvidence?.id, clearSelection]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-slate-700/80 bg-slate-900/60">
      <header className="border-b border-slate-700/80 px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
          Case Files
        </p>
        <h2 className="mt-1 text-sm font-semibold text-slate-100">Evidence Repository</h2>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-slate-700/80 bg-slate-950/40">
          <ul className="divide-y divide-slate-800/80">
            {evidence.map((item) => {
              const isActive = item.id === activeEvidence?.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelectEvidence(item.id)}
                    className={`flex w-full items-start gap-2 px-3 py-3 text-left transition-colors ${
                      isActive
                        ? 'bg-cyan-950/50 text-cyan-100'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <EvidenceTypeIcon type={item.type} />
                    <span className="text-xs leading-snug">{item.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="relative min-h-0 flex-1 overflow-y-auto p-5">
          {activeEvidence ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-mono text-sm font-medium text-slate-200">
                  {activeEvidence.title}
                </h3>
                <span className="rounded border border-slate-700 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  {activeEvidence.type}
                </span>
              </div>

              {activeEvidence.type === 'text' && activeEvidence.content ? (
                <div
                  ref={contentRef}
                  className="relative"
                  onMouseUp={handleMouseUp}
                >
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-300 selection:bg-amber-500/30 selection:text-amber-50">
                    {activeEvidence.content}
                  </pre>

                  {selection && pinButtonPos && (
                    <button
                      type="button"
                      onClick={handlePin}
                      style={{ top: pinButtonPos.top, left: pinButtonPos.left }}
                      className="absolute z-10 flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-950/95 px-3 py-1.5 text-xs font-medium text-amber-100 shadow-lg shadow-black/40 transition hover:border-amber-400 hover:bg-amber-900"
                    >
                      <Pin className="h-3.5 w-3.5" />
                      Pin to Notebook
                    </button>
                  )}
                </div>
              ) : activeEvidence.type === 'image' ? (
                <div className="flex h-48 items-center justify-center rounded border border-dashed border-slate-700 bg-slate-950/50 text-sm text-slate-500">
                  Image evidence — connect Storage URL in metadata for Level 2+
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded border border-dashed border-slate-700 bg-slate-950/50 text-sm text-slate-500">
                  Video evidence — connect Storage URL in metadata for Level 2+
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">No evidence loaded for this level.</p>
          )}
        </div>
      </div>
    </section>
  );
}
