'use client';

/**
 * "Path via" filter state, derived from three array params (wi2_path_kind /
 * wi2_path_members / wi2_path_bridges), with a one-time compat read of the legacy
 * params they replace (wi2_relation_kind / wi2_direct_only / wi2_connector).
 *
 * A nuqs Parser only ever sees its own query key, so this fold-in can't live inside
 * a Parser — it composes the already-read filter state, same as any other derived
 * value. The self-heal write uses history: 'replace' (matching this workspace's own
 * useQueryStates config), so it never pushes a new history entry and isn't a
 * navigation/redirect — an old bookmarked link keeps working, and simply stops
 * being read as legacy after the first render.
 */

import { useEffect, useMemo, useRef } from 'react';
import type { useQueryStates } from 'nuqs';
import type { investorsFilterParsers } from '@/app/investors/(investors-page)/searchParams';
import type { WarmIntrosV2PathRelationKind } from '@/services/investors/warm-intros-v2.types';
import type { PathVia } from './PathViaSelect';

type Filters = ReturnType<typeof useQueryStates<typeof investorsFilterParsers>>[0];
type SetFilters = ReturnType<typeof useQueryStates<typeof investorsFilterParsers>>[1];

type LegacyPathViaInput = {
  wi2_path_kind: WarmIntrosV2PathRelationKind[];
  wi2_path_members: string[];
  wi2_path_bridges: string[];
  wi2_direct_only: boolean | null;
  wi2_relation_kind: WarmIntrosV2PathRelationKind | null;
  wi2_connector: string;
};

type LegacyPathViaMerge = { kind: WarmIntrosV2PathRelationKind[]; members: string[] } | null;

/**
 * Pure decision: does this filter state need a one-time self-heal from the legacy
 * params into the new shape, and if so, what should it write? `null` means no
 * write is needed — either the new shape is already present, or there's nothing
 * legacy to fold in.
 */
export function mergeLegacyPathVia(filters: LegacyPathViaInput): LegacyPathViaMerge {
  const hasNewShape =
    filters.wi2_path_kind.length > 0 || filters.wi2_path_members.length > 0 || filters.wi2_path_bridges.length > 0;
  if (hasNewShape) return null;

  const legacyKind = filters.wi2_direct_only === true ? 'pl_direct' : filters.wi2_relation_kind;
  const legacyMember = filters.wi2_connector || null;
  if (!legacyKind && !legacyMember) return null;

  return {
    kind: legacyKind ? [legacyKind] : [],
    members: legacyMember ? [legacyMember] : [],
  };
}

export function usePathViaFilter(filters: Filters, setFilters: SetFilters) {
  const value = useMemo<PathVia[]>(
    () => [
      ...filters.wi2_path_kind.map((v) => ({ type: 'kind' as const, value: v })),
      ...filters.wi2_path_members.map((v) => ({ type: 'member' as const, value: v })),
      ...filters.wi2_path_bridges.map((v) => ({ type: 'bridge' as const, value: v })),
    ],
    [filters.wi2_path_kind, filters.wi2_path_members, filters.wi2_path_bridges],
  );

  const healedRef = useRef(false);
  useEffect(() => {
    if (healedRef.current) return;
    healedRef.current = true;

    const merge = mergeLegacyPathVia(filters);
    if (!merge) return;

    void setFilters({
      wi2_path_kind: merge.kind,
      wi2_path_members: merge.members,
      wi2_relation_kind: null,
      wi2_direct_only: null,
      wi2_connector: null,
    });
    // The healedRef guard makes this idempotent, so depending on the whole
    // `filters` object (which mergeLegacyPathVia reads as a unit) is safe even if
    // its identity changes on renders that don't affect these fields.
  }, [filters, setFilters]);

  const setValue = (next: PathVia[]) => {
    void setFilters({
      wi2_path_kind: next.filter((v): v is Extract<PathVia, { type: 'kind' }> => v.type === 'kind').map((v) => v.value),
      wi2_path_members: next
        .filter((v): v is Extract<PathVia, { type: 'member' }> => v.type === 'member')
        .map((v) => v.value),
      wi2_path_bridges: next
        .filter((v): v is Extract<PathVia, { type: 'bridge' }> => v.type === 'bridge')
        .map((v) => v.value),
    });
  };

  return { value, setValue };
}
