import type {
  LabosAgentMention,
  LabosAgentMentionChip,
  LabosAgentMentionsResponse,
  LabosAgentOpenContext,
  LabosAgentPickerGroupKind,
  LabosAgentPickerItem,
} from '@/types/labos-agent.types';

import { LABOS_AGENT_MAX_MENTIONS, LABOS_AGENT_MENTION_QUERY_MAX } from './constants';

/**
 * S6 @mentions (LAB-3318, contract section 10). Pure helpers for the picker and the chips. The panel keeps the state;
 * this file has no React.
 */

/** The picker groups in the order of S6-F6. */
export const PICKER_GROUP_ORDER: LabosAgentPickerGroupKind[] = ['page', 'news', 'team', 'member'];

export const PICKER_GROUP_LABELS: Record<LabosAgentPickerGroupKind, string> = {
  page: 'Pages',
  news: 'News',
  team: 'Teams',
  member: 'Members',
};

/** The key of a mention, as the backend dedupes it (contract 10.3): `type:uid`, or `page:<page>`. */
export function mentionKey(mention: LabosAgentMention): string {
  return mention.type === 'page' ? `page:${mention.page}` : `${mention.type}:${mention.uid}`;
}

/**
 * The mention key of the page chip, so the picker hides the item that the agent already reads (S6-F11). `null` for a
 * page that no picker row names (a job post, an intro).
 */
export function contextMentionKey(context: LabosAgentOpenContext | null | undefined): string | null {
  if (!context) return null;
  switch (context.page) {
    case 'news-story':
      return `news:${context.newsUid}`;
    case 'member':
      return `member:${context.memberUid}`;
    case 'team':
      return `team:${context.teamUid}`;
    case 'home':
      return 'page:home';
    case 'profile':
      return 'page:profile';
    case 'job':
      return context.jobUid ? null : 'page:job';
    default:
      return null;
  }
}

/** The fixed page rows (contract 10.5). They always show. */
export const PAGE_ITEMS: LabosAgentPickerItem[] = [
  {
    key: 'page:home',
    kind: 'page',
    label: 'Home',
    meta: 'LabOS Home',
    mentionName: 'Home',
    mention: { type: 'page', page: 'home' },
  },
  {
    key: 'page:job',
    kind: 'page',
    label: 'Jobs',
    meta: 'The job board',
    mentionName: 'Jobs',
    mention: { type: 'page', page: 'job' },
  },
  {
    key: 'page:profile',
    kind: 'page',
    label: 'Your profile',
    meta: 'Your own profile',
    mentionName: 'Your profile',
    mention: { type: 'page', page: 'profile' },
  },
];

/** The key of the "current page" row (contract 10.5). It is not a mention key. */
export const CURRENT_PAGE_KEY = 'current-page';

/** The row for the page chip after the member removed it. A pick turns the chip back on (S6-F7). */
export function currentPageItem(label: string): LabosAgentPickerItem {
  return {
    key: CURRENT_PAGE_KEY,
    kind: 'page',
    label,
    meta: 'The page you are on',
    mentionName: label,
    restoresPage: true,
  };
}

/** The C4 rows as picker rows. News reads as `@<team> news` in the message; the chip has the title. */
export function responseItems(response: LabosAgentMentionsResponse | null | undefined): LabosAgentPickerItem[] {
  if (!response) return [];
  const news = response.news.map(
    (n): LabosAgentPickerItem => ({
      key: `news:${n.uid}`,
      kind: 'news',
      label: n.title,
      meta: n.teamName,
      mentionName: n.teamName ? `${n.teamName} news` : n.title,
      mention: { type: 'news', uid: n.uid },
    }),
  );
  const teams = response.teams.map(
    (t): LabosAgentPickerItem => ({
      key: `team:${t.uid}`,
      kind: 'team',
      label: t.name,
      meta: t.shortDescription ?? undefined,
      mentionName: t.name,
      imageUrl: t.logoUrl,
      mention: { type: 'team', uid: t.uid },
    }),
  );
  const members = response.members.map(
    (m): LabosAgentPickerItem => ({
      key: `member:${m.uid}`,
      kind: 'member',
      label: m.name,
      meta: [m.role, m.teamName].filter(Boolean).join(' · ') || undefined,
      mentionName: m.name,
      imageUrl: m.imageUrl,
      mention: { type: 'member', uid: m.uid },
    }),
  );
  return [...news, ...teams, ...members];
}

export interface LabosAgentPickerGroup {
  kind: LabosAgentPickerGroupKind;
  items: LabosAgentPickerItem[];
}

/**
 * The picker groups (S6-F6, S6-F7, S6-F11). Pages filter in the browser on the label. C4 already filtered the other
 * groups. An item with a chip does not show, and an empty group does not show.
 */
export function pickerGroups({
  query,
  response,
  taken,
  currentPageLabel,
}: {
  query: string;
  /** The C4 response for this query, or null while it loads or after an error. */
  response: LabosAgentMentionsResponse | null;
  /** The keys that already have a chip: the mention chips and the page chip. */
  taken: ReadonlySet<string>;
  /** The label of the page chip after the member removed it. Null when the chip is on or there is no page. */
  currentPageLabel: string | null;
}): LabosAgentPickerGroup[] {
  const q = query.trim().toLowerCase();
  const pages = [...(currentPageLabel ? [currentPageItem(currentPageLabel)] : []), ...PAGE_ITEMS].filter(
    (item) => !q || item.label.toLowerCase().includes(q),
  );
  const all = [...pages, ...responseItems(response)].filter((item) => !taken.has(item.key));
  return PICKER_GROUP_ORDER.map((kind) => ({ kind, items: all.filter((item) => item.kind === kind) })).filter(
    (group) => group.items.length > 0,
  );
}

/**
 * S6-F1: `@` at the start of the text or after a space opens the picker. The text after `@` up to the caret, with no
 * space and up to 30 characters, is the query. `null`: no open `@` (S6-F2: a space or a deleted `@` closes it).
 */
export function readAtQuery(value: string, caret: number): { query: string; start: number } | null {
  const upto = value.slice(0, caret);
  const match = upto.match(new RegExp(`(^|\\s)@([^\\s@]{0,${LABOS_AGENT_MENTION_QUERY_MAX}})$`));
  if (!match) return null;
  return { query: match[2], start: upto.length - match[2].length - 1 };
}

/** S6-F10: puts `@<name> ` in the place of `@<query>`. Returns the new text and the caret after the space. */
export function replaceAtQuery(
  value: string,
  start: number,
  query: string,
  name: string,
): { value: string; caret: number } {
  const before = value.slice(0, start);
  const after = value.slice(start + 1 + query.length).replace(/^\s/, '');
  const insert = `@${name} `;
  return { value: `${before}${insert}${after}`, caret: before.length + insert.length };
}

/** A picker row as a chip. `null` for the current page row: it is the page chip, not a mention. */
export function toMentionChip(item: LabosAgentPickerItem): LabosAgentMentionChip | null {
  if (!item.mention) return null;
  return { key: item.key, label: item.label, kind: item.kind, mention: item.mention };
}

/**
 * S6-F14: the C1 `mentions`, in the order of the chips, with only `type` and `uid`, or `type` and `page`. No label.
 * Undefined when there are no chips, so the body has no `mentions` key. A second chip with the same key drops out.
 */
export function toChatMentions(chips: readonly LabosAgentMentionChip[] | undefined): LabosAgentMention[] | undefined {
  if (!chips || chips.length === 0) return undefined;
  const seen = new Set<string>();
  const mentions: LabosAgentMention[] = [];
  for (const { mention } of chips) {
    const key = mentionKey(mention);
    if (seen.has(key)) continue;
    seen.add(key);
    mentions.push(
      mention.type === 'page' ? { type: 'page', page: mention.page } : { type: mention.type, uid: mention.uid },
    );
  }
  return mentions.slice(0, LABOS_AGENT_MAX_MENTIONS);
}
