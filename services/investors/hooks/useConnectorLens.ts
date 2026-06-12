'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchConnectorMatches } from '../pathfinder.service';
import { InvestorsQueryKeys } from '../constants';
import type { OutreachInvestor } from '../types';

export type ConnectorLensResult = {
  /** Member ids whose paths route through one of the connector nodes. */
  matchedIds: Set<string>;
  isLoading: boolean;
};

/**
 * Connector-lens filter: given the currently visible members and connector node
 * label(s) (a founder/team chosen in the unified search), keep only members
 * whose hop chains route through a matching node. The match runs server-side
 * (POST /pathfinder/connector-matches) as ONE request for the whole visible
 * page — fetching each member's paths individually tripped the API rate limit.
 * Label matching is case-insensitive and runs on the backend.
 */
export function useConnectorLens(
  members: OutreachInvestor[],
  connectorLabels: string | string[],
  enabled: boolean,
): ConnectorLensResult {
  const labels = (Array.isArray(connectorLabels) ? connectorLabels : [connectorLabels])
    .map((l) => (l ?? '').trim())
    .filter((l) => l !== '');
  const active = enabled && labels.length > 0;
  // Exclude only confirmed-cold (has_path === false); undefined means the
  // pathfinder hasn't run yet and the investor may still have a matching path.
  const ids = active ? members.filter((m) => m.has_path !== false).map((m) => m.investor_id) : [];

  const { data, isLoading } = useQuery({
    queryKey: [InvestorsQueryKeys.CONNECTOR_MATCHES, labels.join('|'), ids.join(',')],
    queryFn: () => fetchConnectorMatches(ids, labels),
    enabled: active && ids.length > 0,
    staleTime: 60 * 1000,
  });

  if (!active) return { matchedIds: new Set(), isLoading: false };
  return { matchedIds: new Set(Array.isArray(data) ? data : []), isLoading: ids.length > 0 && isLoading };
}
