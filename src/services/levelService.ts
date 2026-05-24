/**
 * Fetches level content from Supabase and verifies accusations via RPC.
 */

import { supabase } from '@/lib/supabase';
import type {
  AccusationSubmission,
  LevelAccusationConfig,
  LevelData,
  MotiveOption,
  VerificationResult,
} from '@/types/game';

const DEFAULT_MOTIVE_OPTIONS: MotiveOption[] = [
  {
    key: 'false_alibi',
    label: 'Fabricated dock alibi',
    description: 'Claimed to be at Pier 7 during the time of death, but a witness contradicts this.',
  },
  {
    key: 'merger_dispute',
    label: 'Merger financial motive',
    description: 'Stood to lose significant equity if Hale finalized the hostile merger.',
  },
  {
    key: 'wrongful_divorce',
    label: 'Contested divorce settlement',
    description: 'Bitter divorce proceedings left unresolved financial grievances.',
  },
  {
    key: 'self_defense',
    label: 'Escalated argument',
    description: 'A confrontation in the study turned lethal in the heat of the moment.',
  },
];

/** Fallback seed data when Supabase is not configured (local dev preview). */
export const DEMO_LEVEL_DATA: LevelData = {
  level: {
    id: 'demo-level-1',
    level_number: 1,
    title: 'The Harbor Street Murder',
    description:
      'Industrialist Richard Hale was found dead in his locked study at 11:47 PM. Cross-reference alibis, witness accounts, and the autopsy to identify who killed him — and why.',
    is_active: true,
  },
  suspects: [
    {
      id: 'demo-suspect-marcus',
      level_id: 'demo-level-1',
      name: 'Marcus Webb',
      description:
        "Hale's business partner of twelve years. Recently argued over a merger that would have diluted Webb's stake. Claims he was at the docks until midnight.",
      profile_image_url: null,
      display_order: 1,
    },
    {
      id: 'demo-suspect-elena',
      level_id: 'demo-level-1',
      name: 'Elena Vasquez',
      description:
        "Hale's ex-wife. Finalized divorce six months ago with a contentious settlement. Claims she left the estate at 9:30 PM and drove straight home.",
      profile_image_url: null,
      display_order: 2,
    },
  ],
  evidence: [
    {
      id: 'demo-evidence-police',
      level_id: 'demo-level-1',
      title: 'Police Report — Initial Response',
      content: `INCIDENT REPORT #HS-4471
Date: March 14

Officers responded to 22 Harbor Street at 23:52 following a 911 call from housekeeper Agnes Mori.

VICTIM: Richard Hale, 54, found slumped at his desk. Single blunt-force trauma to the occipital region. Time of death estimated between 22:30 and 23:15.

SCENE: Study door locked from inside. Key found in victim's pocket. Window latched. Fireplace poker missing from stand — not recovered on scene.

PERSONS OF INTEREST:
• Marcus Webb — arrived 20:00, seen arguing with Hale in the library. Butler logs show Webb signed out at 21:40.
• Elena Vasquez — arrived 19:15 for document retrieval. Butler logs show departure at 21:35.

SECURITY NOTE: Harbor Street traffic cameras were offline between 21:00–23:30 due to scheduled maintenance on Block C. No footage available for the critical window.`,
      type: 'text',
      metadata: { document_type: 'police_report', case_number: 'HS-4471' },
      display_order: 1,
    },
    {
      id: 'demo-evidence-witness',
      level_id: 'demo-level-1',
      title: 'Witness Statement — Dock Worker',
      content: `STATEMENT OF: Tomás Reyes, night shift foreman, Pier 7

"I know Marcus Webb by sight — he keeps a storage unit down on Pier 7. He's there most Tuesday nights checking inventory.

On March 14 I was on break outside the warehouse around 22:10. I did NOT see Webb's car in the lot. His usual spot — space 14 — was empty. I remember because I nearly parked there myself.

Webb didn't show up until almost midnight. He looked rushed, jacket dusted with something dark on the left sleeve. He went straight to unit 14, stayed maybe ten minutes, and left.

I'd swear on it: Marcus Webb was not at the docks at 22:10."`,
      type: 'text',
      metadata: { document_type: 'witness_statement', witness: 'Tomás Reyes' },
      display_order: 2,
    },
    {
      id: 'demo-evidence-autopsy',
      level_id: 'demo-level-1',
      title: 'Autopsy Log — Preliminary Findings',
      content: `MEDICAL EXAMINER PRELIMINARY REPORT
Subject: Richard Hale

Cause of death: Blunt force trauma, consistent with a heavy metal implement (fireplace poker, per scene inventory).

Notable findings:
• Contusion pattern suggests attacker was right-handed, standing behind victim.
• Victim's fingernails contain trace epithelial tissue — DNA pending.
• Stomach contents indicate last meal consumed approximately 20:30 (steak, red wine).
• Partial shoe impression on study rug: men's dress loafer, size 11, rubber composite heel — matches footwear catalog reference #DL-442 (Webb was photographed wearing identical shoes at a gala last month).

Toxicology: No sedatives detected. Blood alcohol 0.04%.`,
      type: 'text',
      metadata: { document_type: 'autopsy', me_number: 'ME-2024-0314' },
      display_order: 3,
    },
  ],
  accusationConfig: {
    level_id: 'demo-level-1',
    motive_options: DEFAULT_MOTIVE_OPTIONS,
  },
};

export async function fetchLevelData(levelNumber: number): Promise<LevelData> {
  const isConfigured =
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('your-project');

  if (!isConfigured) {
    return DEMO_LEVEL_DATA;
  }

  const { data: level, error: levelError } = await supabase
    .from('levels')
    .select('*')
    .eq('level_number', levelNumber)
    .eq('is_active', true)
    .single();

  if (levelError || !level) {
    throw new Error(levelError?.message ?? 'Level not found');
  }

  const [suspectsResult, evidenceResult, configResult] = await Promise.all([
    supabase
      .from('suspects')
      .select('*')
      .eq('level_id', level.id)
      .order('display_order'),
    supabase
      .from('evidence')
      .select('*')
      .eq('level_id', level.id)
      .order('display_order'),
    supabase
      .from('level_accusation_config')
      .select('level_id, motive_options')
      .eq('level_id', level.id)
      .single(),
  ]);

  if (suspectsResult.error) throw new Error(suspectsResult.error.message);
  if (evidenceResult.error) throw new Error(evidenceResult.error.message);

  const accusationConfig: LevelAccusationConfig = configResult.error
    ? { level_id: level.id, motive_options: DEFAULT_MOTIVE_OPTIONS }
    : (configResult.data as LevelAccusationConfig);

  return {
    level,
    suspects: suspectsResult.data ?? [],
    evidence: evidenceResult.data ?? [],
    accusationConfig,
  };
}

export async function verifyAccusation(
  levelId: string,
  submission: AccusationSubmission,
): Promise<VerificationResult> {
  const isConfigured =
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('your-project');

  if (!isConfigured) {
    const isCorrect =
      submission.suspectId === 'demo-suspect-marcus' &&
      submission.motiveKey === 'false_alibi' &&
      submission.evidenceId === 'demo-evidence-witness';

    return {
      correct: isCorrect,
      message: isCorrect
        ? 'Case closed. Your accusation holds up under scrutiny.'
        : 'The evidence does not support this accusation. Re-examine the case files.',
    };
  }

  const { data, error } = await supabase.rpc('verify_accusation', {
    p_level_id: levelId,
    p_suspect_id: submission.suspectId,
    p_motive_key: submission.motiveKey,
    p_evidence_id: submission.evidenceId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as VerificationResult;
}
