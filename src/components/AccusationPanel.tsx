/**
 * End-of-level accusation modal: suspect, motive, and core evidence submission.
 */

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Gavel,
  Loader2,
  X,
  XCircle,
} from 'lucide-react';
import type {
  AccusationSubmission,
  Evidence,
  MotiveOption,
  Suspect,
  VerificationResult,
} from '@/types/game';

interface AccusationPanelProps {
  isOpen: boolean;
  suspects: Suspect[];
  evidence: Evidence[];
  motiveOptions: MotiveOption[];
  onClose: () => void;
  onSubmit: (submission: AccusationSubmission) => Promise<VerificationResult>;
}

const INITIAL_FORM: AccusationSubmission = {
  suspectId: '',
  motiveKey: '',
  evidenceId: '',
};

export function AccusationPanel({
  isOpen,
  suspects,
  evidence,
  motiveOptions,
  onClose,
  onSubmit,
}: AccusationPanelProps) {
  const [form, setForm] = useState<AccusationSubmission>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const textEvidence = evidence.filter((item) => item.type === 'text');
  const isFormComplete = Boolean(form.suspectId && form.motiveKey && form.evidenceId);

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setResult(null);
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFormComplete) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const verification = await onSubmit(form);
      setResult(verification);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to submit accusation.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accusation-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-slate-600/80 bg-slate-900 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-slate-700/80 px-5 py-4">
          <div className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-red-400" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Final Verdict
              </p>
              <h2 id="accusation-title" className="text-base font-semibold text-slate-100">
                File Accusation
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close accusation panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {result ? (
          <div className="space-y-4 p-5">
            <div
              className={`flex items-start gap-3 rounded-md border p-4 ${
                result.correct
                  ? 'border-emerald-700/50 bg-emerald-950/30'
                  : 'border-red-800/50 bg-red-950/30'
              }`}
            >
              {result.correct ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              )}
              <div>
                <p
                  className={`text-sm font-semibold ${
                    result.correct ? 'text-emerald-300' : 'text-red-300'
                  }`}
                >
                  {result.correct ? 'Accusation Sustained' : 'Accusation Rejected'}
                </p>
                <p className="mt-1 text-sm text-slate-300">{result.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
            >
              {result.correct ? 'Close Case' : 'Reconsider Evidence'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <p className="text-xs leading-relaxed text-slate-400">
              Select the guilty party, identify the key contradiction or motive, and attach
              the single document that proves your case.
            </p>

            <div>
              <label
                htmlFor="suspect-select"
                className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-slate-500"
              >
                Suspect
              </label>
              <select
                id="suspect-select"
                value={form.suspectId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, suspectId: event.target.value }))
                }
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-red-600/60 focus:outline-none focus:ring-1 focus:ring-red-600/40"
                required
              >
                <option value="">— Select suspect —</option>
                {suspects.map((suspect) => (
                  <option key={suspect.id} value={suspect.id}>
                    {suspect.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="motive-select"
                className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-slate-500"
              >
                Motive / Contradiction
              </label>
              <select
                id="motive-select"
                value={form.motiveKey}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, motiveKey: event.target.value }))
                }
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-red-600/60 focus:outline-none focus:ring-1 focus:ring-red-600/40"
                required
              >
                <option value="">— Select motive —</option>
                {motiveOptions.map((motive) => (
                  <option key={motive.key} value={motive.key}>
                    {motive.label}
                  </option>
                ))}
              </select>
              {form.motiveKey && (
                <p className="mt-1.5 text-xs text-slate-500">
                  {motiveOptions.find((m) => m.key === form.motiveKey)?.description}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="evidence-select"
                className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-slate-500"
              >
                Core Evidence
              </label>
              <select
                id="evidence-select"
                value={form.evidenceId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, evidenceId: event.target.value }))
                }
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-red-600/60 focus:outline-none focus:ring-1 focus:ring-red-600/40"
                required
              >
                <option value="">— Attach document —</option>
                {textEvidence.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-800/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!isFormComplete || isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-red-700/60 bg-red-950/60 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:border-red-500 hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileSearch className="h-4 w-4" />
                  Submit Accusation
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
