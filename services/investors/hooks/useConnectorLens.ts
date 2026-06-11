'use client';

import { useQueries } from '@tanstack/react-query';
import { fetchPathsForTarget } from '../pathfinder.service';
import { InvestorsQueryKeys } from '../constants';
import type { OutreachInvestor } from '../types';

export type ConnectorLensResult = {
  /** Member ids whose best paths route through the connector node. */
  matchedIds: Set<string>;
  isLoading: boolean;
};

/**
 * Connector-lens filter: given the currently visible members and a connector
 * node label (a founder/team chosen in the unified search), fetch each member's
 * ranked paths and keep only those whose hop_chain includes a node matching the
 * label. We don't have per-member path data in the list rows (only the
 * denormalized `best_proximity_code`), so we fetch on demand — bounded to the
 * visible page of members and only while a lens is active.
 *
 * Simplest correct approach for v1. If this proves too chatty at scale, the BE
 * can add a `connector=` filter to `GET /investor-lists/:id/members` and this
 * hook drops out.
 */
export function useConnectorLens(
  members: OutreachInvestor[],
  connectorLabel: string,
  enabled: boolean,
): ConnectorLensResult {
  const active = enabled && !!connectorLabel;
  // Exclude only confirmed-cold (has_path === false); undefined means the
  // pathfinder hasn't run yet and the investor may still have a matching path.
  const ids = active ? members.filter((m) => m.has_path !== false).map((m) => m.investor_id) : [];

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: [InvestorsQueryKeys.PATHS_FOR_TARGET, id],
      queryFn: () => fetchPathsForTarget(id),
      enabled: active,
      staleTime: 60 * 1000,
    })),
  });

  if (!active) return { matchedIds: new Set(), isLoading: false };

  const needle = connectorLabel.trim().toLowerCase();
  const matchedIds = new Set<string>();
  let isLoading = false;

  results.forEach((res, i) => {
    if (res.isLoading) {
      isLoading = true;
      return;
    }
    const paths = res.data?.paths ?? [];
    const hit = paths.some((p) => p.hop_chain.nodes.some((n) => n.label.trim().toLowerCase() === needle));
    if (hit) matchedIds.add(ids[i]);
  });

  return { matchedIds, isLoading };
}
