import { CRITERION_GROUPS, type CriterionGroup } from '@/schema/suggested-candidates';

interface Structured {
  text: string;
  label?: string | null;
  group?: CriterionGroup;
}

export interface CriteriaSection<T> {
  /** The header, or `null` for the one flat list an ungrouped role gets. */
  group: CriterionGroup | null;
  /** The criteria under it, each with its index in the list the server sent (for stable keys). */
  items: { criterion: T; index: number }[];
}

/**
 * The role's requirements under their headers (LAB-2854): Skills, Experience,
 * Seniority, Location, Other, in that order, empty groups left out, and the
 * server's order kept inside each.
 *
 * When no requirement has a group (a backend that does not group yet) the
 * answer is one section with no header, so the list reads as it did before.
 * When only some do, the ungrouped ones go under Other rather than sitting
 * above the headers with none.
 */
export function groupCriteria<T extends Structured>(criteria: T[]): CriteriaSection<T>[] {
  const items = criteria.map((criterion, index) => ({ criterion, index }));
  if (!criteria.some((c) => c.group)) return items.length ? [{ group: null, items }] : [];

  return CRITERION_GROUPS.map((group) => ({
    group,
    items: items.filter(({ criterion }) => (criterion.group ?? 'Other') === group),
  })).filter((section) => section.items.length > 0);
}

/**
 * A requirement's two lines: the short label over the full statement, or the
 * statement alone when the backend sent no label (or a blank one).
 */
export function criterionLines(criterion: Structured): { primary: string; statement: string | null } {
  const label = criterion.label?.trim();
  return label ? { primary: label, statement: criterion.text } : { primary: criterion.text, statement: null };
}
