import type { GantryItem, GantryObjective } from '@/services/gantry/types';

// All five levels are positive degrees of impact (no "No impact" — you only rate by boosting,
// and boosting something implies at least minor impact). "Critical" is the decisive top.
export type ImpactLevel = 'minor' | 'moderate' | 'significant' | 'high' | 'critical';

/** Numeric value of each impact level, used to compute averages (1..5). */
export const IMPACT_VALUE: Record<ImpactLevel, number> = {
  minor: 1,
  moderate: 2,
  significant: 3,
  high: 4,
  critical: 5,
};

export const IMPACT_LABELS: Record<ImpactLevel, string> = {
  minor: 'Minor',
  moderate: 'Moderate',
  significant: 'Significant',
  high: 'High',
  critical: 'Critical',
};

/** Ascending — the order chips are shown for rating. */
export const IMPACT_LEVELS: ImpactLevel[] = ['minor', 'moderate', 'significant', 'high', 'critical'];

/** Descending — the order the distribution breakdown is read. */
export const IMPACT_LEVELS_DESC: ImpactLevel[] = ['critical', 'high', 'significant', 'moderate', 'minor'];

export const IMPACT_MAX = 5;

export type ImpactDistribution = Record<ImpactLevel, number>;

const emptyDist = (): ImpactDistribution => ({ minor: 0, moderate: 0, significant: 0, high: 0, critical: 0 });

export interface PerObjectiveImpact {
  objectiveUid: string;
  avg: number | null;
  count: number;
}

/** One member's impact rating, incl. the optional "why now" note from the boost popover. */
export interface ImpactRating {
  uid: string;
  member: { uid: string; name: string; imageUrl: string | null };
  level: ImpactLevel;
  note: string | null;
}

const RATER_NAMES = [
  'Ines Kovač',
  'Tomás Ferreira',
  'Ada Osei',
  'Yuki Tanaka',
  'Lena Fischer',
  'Ravi Patel',
  'Sofia Marino',
  'Jonas Berg',
  'Amara Diallo',
  'Felix Wagner',
  'Noa Levi',
  'Diego Ramos',
  'Hana Kim',
  'Otto Lindqvist',
  'Zara Ahmed',
  'Pavel Novak',
  'Maja Nilsen',
  'Kofi Mensah',
  'Elif Demir',
  'Bruno Costa',
  'Anya Petrova',
  'Liam Walsh',
  'Chiara Ricci',
  'Mateo Vargas',
  'Freja Holm',
  'Tariq Aziz',
];

let raterSeq = 0;

/**
 * Expands a distribution into named raters (high → none), attaching the given notes to the
 * first raters. Keeps the rater list consistent with the counts.
 */
function buildRatings(dist: ImpactDistribution, notes: string[] = []): ImpactRating[] {
  const levels: ImpactLevel[] = IMPACT_LEVELS_DESC.flatMap((level) => Array<ImpactLevel>(dist[level]).fill(level));
  return levels.map((level, i) => {
    raterSeq += 1;
    return {
      uid: `rating-${raterSeq}`,
      member: { uid: `rater-${raterSeq}`, name: RATER_NAMES[(raterSeq - 1) % RATER_NAMES.length], imageUrl: null },
      level,
      note: notes[i] ?? null,
    };
  });
}

/** Sum a distribution minus one unit of `level` (used to derive others' ratings from the viewer's). */
function distMinus(dist: ImpactDistribution, level: ImpactLevel): ImpactDistribution {
  return { ...dist, [level]: Math.max(0, dist[level] - 1) };
}

/** The impact-rating signal that rides alongside a production Gantry item. */
export interface ImpactData {
  /** The full community distribution, INCLUDING the viewer's seeded rating (if any). */
  impactDistribution: ImpactDistribution;
  perObjectiveImpact: PerObjectiveImpact[];
  viewerImpact: ImpactLevel | null;
  /**
   * The author's mandatory "expected impact" from submission — a claim, never folded into
   * the community average (self-assessments bias high).
   */
  /**
   * The author's free-text reasoning — the "author's reasoning" version's whole goal expression.
   * The author never rates; only the community's boosts produce the impact score.
   */
  authorClaimNote: string | null;
  /** Everyone who rated (excluding the viewer — their live rating is layered on top). */
  ratings: ImpactRating[];
}

export type MockRoadmapItem = GantryItem & { impact: ImpactData };

const ISO = '2026-05-01T00:00:00.000Z';

const OBJ = {
  grow: { uid: 'obj-1', order: 1, title: 'Grow the active network' },
  toil: { uid: 'obj-2', order: 2, title: 'Reduce operator toil' },
  august: { uid: 'obj-3', order: 3, title: 'Ship the August release' },
};

/** Objectives (company goals) for the filter rail (GantryObjective shape). */
export const mockImpactObjectives: GantryObjective[] = [
  { uid: OBJ.grow.uid, order: OBJ.grow.order, title: OBJ.grow.title, itemCount: 3, createdAt: ISO },
  { uid: OBJ.toil.uid, order: OBJ.toil.order, title: OBJ.toil.title, itemCount: 2, createdAt: ISO },
  { uid: OBJ.august.uid, order: OBJ.august.order, title: OBJ.august.title, itemCount: 2, createdAt: ISO },
];

/** Fills in the GantryItem fields a card reads but the impact story doesn't care about. */
function base(item: Partial<GantryItem>): GantryItem {
  return {
    uid: '',
    title: '',
    description: '',
    acceptanceCriteria: null,
    stage: 'PLANNED',
    focusArea: null,
    objectives: [],
    tags: null,
    type: null,
    order: null,
    createdByUid: 'member-x',
    createdBy: { uid: 'member-x', name: 'Member', imageUrl: null },
    promotedAt: null,
    promotedByUid: null,
    declinedReason: null,
    externalTrackerUrl: null,
    upvoteCount: 0,
    viewerHasUpvoted: false,
    pinCount: 0,
    viewerHasPinned: false,
    viewerPinNote: null,
    deletedAt: null,
    createdAt: ISO,
    updatedAt: ISO,
    ...item,
  };
}

export const mockRoadmapItems: MockRoadmapItem[] = [
  {
    ...base({
      uid: 'impact-item-1',
      title: 'De-duplicate member records on import',
      description:
        'Quietly filed, barely boosted — but every operator who has run an import says duplicates are the single biggest source of cleanup toil.',
      stage: 'IDEA',
      objectives: [OBJ.grow, OBJ.toil],
      tags: ['Directory'],
      type: 'Enhancement Request',
      pinCount: 9,
      viewerHasPinned: false,
      createdBy: { uid: 'member-2', name: 'Priya Nair', imageUrl: null },
    }),
    impact: (() => {
      const dist: ImpactDistribution = { minor: 0, moderate: 1, significant: 2, high: 5, critical: 14 };
      return {
        impactDistribution: dist,
        perObjectiveImpact: [
          { objectiveUid: 'obj-1', avg: 4.2, count: 16 },
          { objectiveUid: 'obj-2', avg: 4.6, count: 21 },
        ],
        viewerImpact: null,
        authorClaimNote:
          'Duplicates are the top cleanup cost every operator names — fixing import de-dup directly cuts operator toil and unblocks onboarding.',
        ratings: buildRatings(dist, [
          'Every import we run ends in a week of manual cleanup.',
          'Blocking our onboarding pipeline for the spring cohort.',
          'Ops spends ~2 days/month on duplicate records.',
        ]),
      };
    })(),
  },
  {
    ...base({
      uid: 'impact-item-2',
      title: 'Custom card background colors',
      description:
        'Let members recolor their directory cards. Frequently requested in feedback threads, but it does not move either objective much.',
      stage: 'PLANNED',
      order: 2,
      objectives: [OBJ.grow],
      tags: ['Directory', 'Home Page'],
      type: 'New Feature Request',
      pinCount: 34,
      viewerHasPinned: true,
      createdBy: { uid: 'member-1', name: 'Alex Rivera', imageUrl: null },
    }),
    impact: (() => {
      const dist: ImpactDistribution = { minor: 6, moderate: 9, significant: 3, high: 1, critical: 0 };
      return {
        impactDistribution: dist,
        perObjectiveImpact: [{ objectiveUid: 'obj-1', avg: 1.9, count: 19 }],
        viewerImpact: 'moderate',
        authorClaimNote:
          'Members ask for this constantly on onboarding calls — I expect it to lift engagement and daily returns to the directory.',
        ratings: buildRatings(distMinus(dist, 'moderate'), ['Our members keep asking for this in onboarding calls.']),
      };
    })(),
  },
  {
    ...base({
      uid: 'impact-item-3',
      title: 'One-click team → project linking',
      description:
        'Both loud and load-bearing: high demand across teams and a clear lift to network activity and operator workflows alike.',
      stage: 'IN_PROGRESS',
      order: 1,
      objectives: [OBJ.grow, OBJ.toil, OBJ.august],
      tags: ['Directory', 'Teams'],
      type: 'New Feature Request',
      pinCount: 37,
      viewerHasPinned: true,
      createdBy: { uid: 'member-3', name: 'Marcus Lee', imageUrl: null },
    }),
    impact: (() => {
      const dist: ImpactDistribution = { minor: 0, moderate: 1, significant: 3, high: 7, critical: 15 };
      return {
        impactDistribution: dist,
        perObjectiveImpact: [
          { objectiveUid: 'obj-1', avg: 4.5, count: 24 },
          { objectiveUid: 'obj-2', avg: 4.1, count: 18 },
          { objectiveUid: 'obj-3', avg: 4.7, count: 20 },
        ],
        viewerImpact: 'critical',
        authorClaimNote:
          'Load-bearing for the August release and the Q3 team-project audit — it moves all three objectives at once.',
        ratings: buildRatings(distMinus(dist, 'critical'), [
          'Needed before the Q3 team-project audit.',
          'Would cut our weekly sync prep in half.',
        ]),
      };
    })(),
  },
  {
    ...base({
      uid: 'impact-item-4',
      title: 'Weekly digest of roadmap changes',
      description:
        'Shipped last month. A quiet win that kept members looped in without extra pings — steady lift to network engagement.',
      stage: 'SHIPPED',
      order: 1,
      objectives: [OBJ.grow, OBJ.august],
      tags: ['Directory', 'News Feed'],
      type: 'Enhancement Request',
      pinCount: 21,
      viewerHasPinned: false,
      createdBy: { uid: 'member-4', name: 'Dana Whit', imageUrl: null },
    }),
    impact: (() => {
      const dist: ImpactDistribution = { minor: 0, moderate: 1, significant: 3, high: 5, critical: 5 };
      return {
        impactDistribution: dist,
        perObjectiveImpact: [{ objectiveUid: 'obj-1', avg: 4.0, count: 14 }],
        viewerImpact: null,
        authorClaimNote:
          'A steady engagement lift — keeps members looped in on roadmap changes without adding notification noise.',
        ratings: buildRatings(dist, ['Kept our team in the loop without extra meetings.']),
      };
    })(),
  },
];

export const mockCurrentUser = { uid: 'member-current', name: 'Maya Chen', imageUrl: null };

/**
 * Shapes a freshly submitted item. The author's own rating is the FIRST community rating —
 * it seeds the distribution (count 1) as the author's boost, not a separate author claim.
 */
export function createImpactItem(input: {
  uid: string;
  title: string;
  description: string;
  stage: GantryItem['stage'];
  tags: string[];
  type: GantryItem['type'];
  objectives: { uid: string; order: number; title: string }[];
  authorClaimNote: string;
  authorRating: ImpactLevel;
}): MockRoadmapItem {
  const impactDistribution = emptyDist();
  impactDistribution[input.authorRating] = 1;
  return {
    ...base({
      uid: input.uid,
      title: input.title,
      description: input.description,
      stage: input.stage,
      objectives: input.objectives,
      tags: input.tags,
      type: input.type,
      createdBy: mockCurrentUser,
      createdByUid: mockCurrentUser.uid,
      // The author boosted + rated their own item on submit.
      pinCount: 1,
      viewerHasPinned: true,
    }),
    impact: {
      impactDistribution,
      perObjectiveImpact: [],
      viewerImpact: input.authorRating,
      authorClaimNote: input.authorClaimNote.trim(),
      ratings: [],
    },
  };
}
