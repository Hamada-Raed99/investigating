/**
 * Core TypeScript interfaces for the investigation game.
 * Mirrors Supabase schema; designed to scale for image/video evidence.
 */

export type EvidenceType = 'text' | 'image' | 'video';

export interface Level {
  id: string;
  level_number: number;
  title: string;
  description: string;
  is_active: boolean;
}

export interface Suspect {
  id: string;
  level_id: string;
  name: string;
  description: string;
  profile_image_url: string | null;
  display_order: number;
}

export interface Evidence {
  id: string;
  level_id: string;
  title: string;
  content: string | null;
  type: EvidenceType;
  metadata: Record<string, unknown>;
  display_order: number;
}

export interface MotiveOption {
  key: string;
  label: string;
  description: string;
}

/** Motive options are fetched from a public view (no correct answer exposed). */
export interface LevelAccusationConfig {
  level_id: string;
  motive_options: MotiveOption[];
}

export interface PinnedSnippet {
  id: string;
  text: string;
  sourceTitle: string;
  pinnedAt: string;
}

export interface NotebookState {
  freeformNotes: string;
  pinnedSnippets: PinnedSnippet[];
}

export interface AccusationSubmission {
  suspectId: string;
  motiveKey: string;
  evidenceId: string;
}

export interface VerificationResult {
  correct: boolean;
  message: string;
}

export interface LevelData {
  level: Level;
  suspects: Suspect[];
  evidence: Evidence[];
  accusationConfig: LevelAccusationConfig;
}

export interface TextSelectionPayload {
  text: string;
  sourceTitle: string;
}
