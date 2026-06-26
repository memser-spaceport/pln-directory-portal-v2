import type { PrototypeEntry, PrototypeGroup } from './types';

export const prototypeRegistry: PrototypeEntry[] = [
  {
    key: 'template',
    title: 'Starter template',
    description: 'Copy this entry as a starting point — mock list, detail panel, and local state.',
    category: 'Getting started',
    load: () => import('./entries/template/TemplatePrototype'),
  },
  {
    key: 'gantry-priority-support',
    title: 'Gantry priority support',
    description: 'Compare current upvote UX with eight prioritization patterns on mocked Gantry need cards.',
    category: 'Gantry',
    load: () => import('./entries/gantry-priority-support/GantryPrioritySupportPrototype'),
  },
  {
    key: 'gantry-saved-draft-item',
    title: 'Gantry saved draft item',
    description: 'Mocked autosave visibility flow for a single Gantry item draft shown in filters.',
    category: 'Gantry',
    load: () => import('./entries/gantry-saved-draft-item/GantrySavedDraftItemPrototype'),
  },
  {
    key: 'founder-db',
    title: 'Founder DB — ranking improvements',
    description:
      'Alignment as its own tier-colored column (segmented meter + %), a "Strong fit · top 10" band, rank numbers, default Sort by Alignment, row checkboxes with bulk approve/export, and a drawer with a top fit-summary and sticky Approve footer.',
    category: 'Founder DB',
    load: () => import('./entries/founder-db/FounderDbPrototype'),
  },
  {
    key: 'warm-intros-filter-update',
    title: 'Warm intros update',
    description:
      'People-first warm-intros workspace: connector states (in-network / external / org-unknown), per-investor paths, and an investor drawer with sticky header.',
    category: 'Investor DB',
    load: () => import('./entries/warm-intros-filter-update/WarmIntrosFilterUpdatePrototype'),
  },
  {
    key: 'teams',
    title: 'Teams — listing page',
    description:
      'Mocked recreation of the teams listing: filters rail, toolbar (search / sort / view toggle), and a responsive grid of real TeamGridView cards linking to the team profile.',
    category: 'Teams',
    load: () => import('./entries/teams/TeamsPrototype'),
  },
  {
    key: 'team-profile',
    title: 'Team profile',
    description:
      'Mocked recreation of the team detail page: details, fund details, contact, membership / communities, members, focus areas, and projects — composed from real detail-page components.',
    category: 'Teams',
    load: () => import('./entries/team-profile/TeamProfilePrototype'),
  },
  {
    key: 'warm-intros-columns',
    title: 'Warm intros — connection columns',
    description:
      'Investor spine with Proximity + Direct + 1-hop connector columns (founders, co-investors, and org/person-unknown), a "direct only" quick filter, and per-connector filtering.',
    category: 'Investor DB',
    load: () => import('./entries/warm-intros-columns/WarmIntrosColumnsPrototype'),
  },
  {
    key: 'warm-path-states',
    title: 'Warm path — states reference',
    description: 'Dev reference: every node state and warm-path card state in one place, rendered through the real components.',
    category: 'Investor DB',
    load: () => import('./entries/warm-intros-filter-update/WarmPathStatesPrototype'),
  },
  {
    key: 'members',
    title: 'Members — listing page',
    description:
      'Production members listing recreated with mocked data: filters rail, toolbar (search, sort, grid/list toggle), and the real member cards. Cards link through to the Affinity profile prototype.',
    category: 'Members',
    load: () => import('./entries/members/MembersPrototype'),
  },
  {
    key: 'member-profile',
    title: 'Member profile — Affinity relationship',
    description:
      'Member profile page augmented with Affinity CRM context: relationship owner, last contact (date + one-line summary), and an interaction-frequency read (high-touch vs neglected) over the last 6 months.',
    category: 'Members',
    load: () => import('./entries/member-profile/MemberProfilePrototype'),
  },
  {
    key: 'ai-apps',
    title: 'AI Apps',
    description:
      'Mocked recreation of the PL Infra AI Apps page: app grid, the "Create AI App" step-by-step modal, and a detail view embedding a deployed app preview — composed from the real page components and SCSS.',
    category: 'AI Apps',
    load: () => import('./entries/ai-apps/AiAppsPrototype'),
  },
  // TODO: prototype not built yet — folder entries/warm-intros-side-drawer-improvements/ is missing.
  // Re-enable this entry once WarmIntrosSideDrawerPrototype.tsx exists (the import below breaks the build otherwise).
  // {
  //   key: 'warm-intros-side-drawer-improvements',
  //   title: 'Warm Intros side drawer improvements',
  //   description: 'Mocked Investor DB drawer preview for surfacing warm-intro context near the top.',
  //   category: 'Investor DB',
  //   load: () => import('./entries/warm-intros-side-drawer-improvements/WarmIntrosSideDrawerPrototype'),
  // },
];

export function getPrototypeEntry(key: string): PrototypeEntry | undefined {
  return prototypeRegistry.find((entry) => entry.key === key);
}

export function getPrototypeKeys(): string[] {
  return prototypeRegistry.map((entry) => entry.key);
}

export function getPrototypesByCategory(): PrototypeGroup[] {
  const groups = new Map<string, PrototypeEntry[]>();

  for (const entry of prototypeRegistry) {
    const items = groups.get(entry.category) ?? [];
    items.push(entry);
    groups.set(entry.category, items);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({ category, items }));
}
