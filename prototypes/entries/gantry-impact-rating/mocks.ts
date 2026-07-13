import type { GantryItem, GantryObjective } from '@/services/gantry/types';

export type ImpactLevel = 'low' | 'medium' | 'high';

/** Numeric value of each impact level, used to compute averages (1..3). */
export const IMPACT_VALUE: Record<ImpactLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export const IMPACT_LABELS: Record<ImpactLevel, string> = {
  low: 'Minor',
  medium: 'Meaningful',
  high: 'Major',
};

export const IMPACT_LEVELS: ImpactLevel[] = ['low', 'medium', 'high'];

export interface PerObjectiveImpact {
  objectiveUid: string;
  avg: number | null;
  count: number;
}

/** The new impact-rating signal that rides alongside a production Gantry item. */
export interface ImpactData {
  impactCount: number;
  avgImpact: number | null;
  impactDistribution: { low: number; medium: number; high: number };
  perObjectiveImpact: PerObjectiveImpact[];
  viewerImpact: ImpactLevel | null;
}

export type MockRoadmapItem = GantryItem & { impact: ImpactData };

const ISO = '2026-05-01T00:00:00.000Z';

const OBJ = {
  grow: { uid: 'obj-1', order: 1, title: 'Grow the active network' },
  toil: { uid: 'obj-2', order: 2, title: 'Reduce operator toil' },
};

/** Objectives for the filter rail (GantryObjective shape). */
export const mockImpactObjectives: GantryObjective[] = [
  {
    uid: OBJ.grow.uid,
    order: OBJ.grow.order,
    title: OBJ.grow.title,
    itemCount: 3,
    createdAt: '2026-05-01T00:00:00.000Z',
  },
  {
    uid: OBJ.toil.uid,
    order: OBJ.toil.order,
    title: OBJ.toil.title,
    itemCount: 2,
    createdAt: '2026-05-01T00:00:00.000Z',
  },
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

/**
 * Three items across real board columns, chosen so the demand × impact matrix is legible:
 *  - Submitted: low demand + high impact  → "Evangelize" (the blind spot boost never surfaces)
 *  - Planned:   high demand + low impact  → "Manage expectations"
 *  - In Progress: high demand + high impact → "Do first"
 */
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
      pinCount: 4,
      viewerHasPinned: false,
      createdBy: { uid: 'member-2', name: 'Priya Nair', imageUrl: null },
    }),
    impact: {
      impactCount: 22,
      avgImpact: 2.8,
      impactDistribution: { low: 1, medium: 4, high: 17 },
      perObjectiveImpact: [
        { objectiveUid: 'obj-1', avg: 2.4, count: 16 },
        { objectiveUid: 'obj-2', avg: 2.9, count: 21 },
      ],
      // Ratings ride the boost — the viewer hasn't boosted this one, so no viewer rating.
      viewerImpact: null,
    },
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
      pinCount: 28,
      viewerHasPinned: true,
      createdBy: { uid: 'member-1', name: 'Alex Rivera', imageUrl: null },
    }),
    impact: {
      impactCount: 19,
      avgImpact: 1.3,
      impactDistribution: { low: 14, medium: 4, high: 1 },
      perObjectiveImpact: [{ objectiveUid: 'obj-1', avg: 1.3, count: 19 }],
      viewerImpact: 'low',
    },
  },
  {
    ...base({
      uid: 'impact-item-3',
      title: 'One-click team → project linking',
      description:
        'Both loud and load-bearing: high demand across teams and a clear lift to network activity and operator workflows alike.',
      stage: 'IN_PROGRESS',
      order: 1,
      objectives: [OBJ.grow, OBJ.toil],
      tags: ['Directory', 'Teams'],
      type: 'New Feature Request',
      pinCount: 31,
      viewerHasPinned: true,
      createdBy: { uid: 'member-3', name: 'Marcus Lee', imageUrl: null },
    }),
    impact: {
      impactCount: 26,
      avgImpact: 2.7,
      impactDistribution: { low: 1, medium: 6, high: 19 },
      perObjectiveImpact: [
        { objectiveUid: 'obj-1', avg: 2.8, count: 24 },
        { objectiveUid: 'obj-2', avg: 2.5, count: 18 },
      ],
      viewerImpact: 'high',
    },
  },
  {
    ...base({
      uid: 'impact-item-4',
      title: 'Weekly digest of roadmap changes',
      description:
        'Shipped last month. A quiet win that kept members looped in without extra pings — steady lift to network engagement.',
      stage: 'SHIPPED',
      order: 1,
      objectives: [OBJ.grow],
      tags: ['Directory', 'News Feed'],
      type: 'Enhancement Request',
      pinCount: 17,
      viewerHasPinned: false,
      createdBy: { uid: 'member-4', name: 'Dana Whit', imageUrl: null },
    }),
    impact: {
      impactCount: 14,
      avgImpact: 2.4,
      impactDistribution: { low: 1, medium: 6, high: 7 },
      perObjectiveImpact: [{ objectiveUid: 'obj-1', avg: 2.4, count: 14 }],
      // Not boosted by the viewer → no viewer rating.
      viewerImpact: null,
    },
  },
];
