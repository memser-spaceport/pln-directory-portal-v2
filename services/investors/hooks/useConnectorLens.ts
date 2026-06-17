'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchConnectorMatches } from '../pathfinder.service';
import { InvestorsQueryKeys } from '../constants';
import type { OutreachInvestor } from '../types';

export type ConnectorLensLabels = {
  exactLabels: string[];
  containsLabels?: string[];
};

export type ConnectorLensResult = {
  /** Member ids whose paths route through one of the connector nodes. */
  matchedIds: Set<string>;
  isLoading: boolean;
};

const MAX_CONNECTOR_MATCH_IDS = 500;

function normalizeLabels(labels: string[]): string[] {
  return labels.map((l) => l.trim()).filter((l) => l !== '');
}

function chunkIds(ids: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
}

async function fetchConnectorMatchesBatched(
  ids: string[],
  exactLabels: string[],
  containsLabels: string[],
): Promise<string[]> {
  const chunks = chunkIds(ids, MAX_CONNECTOR_MATCH_IDS);
  const results = await Promise.all(chunks.map((chunk) => fetchConnectorMatches(chunk, exactLabels, containsLabels)));
  return [...new Set(results.flat())];
}

/**
 * Connector-lens filter: given the currently visible members and connector node
 * label(s) (chosen in the unified search), keep only members whose hop chains
 * route through a matching node. The match runs server-side
 * (POST /pathfinder/connector-matches), batched when loaded members exceed 500.
 */
export function useConnectorLens(
  members: OutreachInvestor[],
  { exactLabels, containsLabels = [] }: ConnectorLensLabels,
  enabled: boolean,
): ConnectorLensResult {
  const labels = normalizeLabels(exactLabels);
  const contains = normalizeLabels(containsLabels);
  const active = enabled && (labels.length > 0 || contains.length > 0);
  // Exclude only confirmed-cold (has_path === false); undefined means the
  // pathfinder hasn't run yet and the investor may still have a matching path.
  const ids = active ? members.filter((m) => m.has_path !== false).map((m) => m.investor_id) : [];

  const { data, isLoading } = useQuery({
    queryKey: [InvestorsQueryKeys.CONNECTOR_MATCHES, labels.join('|'), contains.join('|'), ids.join(',')],
    queryFn: () => fetchConnectorMatchesBatched(ids, labels, contains),
    enabled: active && ids.length > 0,
    staleTime: 60 * 1000,
  });

  if (!active) return { matchedIds: new Set(), isLoading: false };
  return { matchedIds: new Set(Array.isArray(data) ? data : []), isLoading: ids.length > 0 && isLoading };
}
