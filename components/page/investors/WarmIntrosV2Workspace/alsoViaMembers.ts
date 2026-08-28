import type { WarmIntrosV2PathListItem } from '@/services/investors/warm-intros-v2.types';

type PathRow = Pick<WarmIntrosV2PathListItem, 'bestConnectorProfileUid' | 'alternateConnectorProfileUids'>;

export type SelectedMember = { uid: string; name: string };

/**
 * Selected PL members who explain why this row is here but aren't visible in it.
 *
 * "Path via → PL member" matches a member who is the best connector OR merely an
 * alternate one, but the Path column only ever draws the best connector's chain. So a
 * row can match on someone the user picked and then show a chain with two other names
 * in it, which reads as broken filtering. Naming the member closes that gap.
 *
 * The best connector is deliberately excluded — it's already the first hop, and saying
 * it twice is noise rather than explanation.
 */
export function alsoViaMembers(row: PathRow, selected: SelectedMember[]): string[] {
  if (selected.length === 0) return [];

  const alternates = Array.isArray(row.alternateConnectorProfileUids)
    ? row.alternateConnectorProfileUids.filter((uid): uid is string => typeof uid === 'string')
    : [];
  if (alternates.length === 0) return [];

  return selected
    .filter((member) => member.uid !== row.bestConnectorProfileUid && alternates.includes(member.uid))
    .map((member) => member.name);
}
