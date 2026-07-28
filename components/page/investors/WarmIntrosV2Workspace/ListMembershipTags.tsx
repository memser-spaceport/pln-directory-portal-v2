'use client';

import clsx from 'clsx';
import {
  WARM_INTROS_V2_LIST_TAG_LABEL,
  WARM_INTROS_V2_TARGET_SETS,
  type WarmIntrosV2TargetSet,
} from '@/services/investors/warm-intros-v2.types';
import s from './ListMembershipTags.module.scss';

const KNOWN_SET = new Set<string>(WARM_INTROS_V2_TARGET_SETS);

interface Props {
  listSlugs?: string[] | null;
  /** When memberships are empty, still show a chip for the path row's targetSet. */
  fallbackTargetSet?: string | null;
  className?: string;
}

function resolveSlugs(listSlugs?: string[] | null, fallbackTargetSet?: string | null): WarmIntrosV2TargetSet[] {
  const found = new Set<string>();
  for (const slug of listSlugs ?? []) {
    if (KNOWN_SET.has(slug)) found.add(slug);
  }
  if (found.size === 0 && fallbackTargetSet && KNOWN_SET.has(fallbackTargetSet)) {
    found.add(fallbackTargetSet);
  }
  return WARM_INTROS_V2_TARGET_SETS.filter((slug) => found.has(slug));
}

function pillClass(slug: WarmIntrosV2TargetSet): string | undefined {
  if (slug === 'neuro-fund-i') return s.listNeuro;
  if (slug === 'gold-co-investors') return s.listGold;
  return undefined;
}

/**
 * Compact Neuro / Gold membership chips for Warm Intros v2 table + drawer.
 */
export function ListMembershipTags({ listSlugs, fallbackTargetSet, className }: Props) {
  const slugs = resolveSlugs(listSlugs, fallbackTargetSet);
  if (slugs.length === 0) return null;

  return (
    <div className={clsx(s.row, className)} aria-label="List memberships">
      {slugs.map((slug) => (
        <span key={slug} className={clsx(s.pill, pillClass(slug))}>
          {WARM_INTROS_V2_LIST_TAG_LABEL[slug]}
        </span>
      ))}
    </div>
  );
}
