import { customFetch } from '@/utils/fetch-wrapper';
import type {
  CorrectionInput,
  PathCaliber,
  PathConnectorType,
  PathCorrection,
  PathHopChain,
  PathfinderPath,
  PathsForTargetResponse,
} from './types';

// PL Path Finder read + corrections API. Reuses the Investor DB permissions
// (investor_db.view / .edit) — no new perms. Mirrors the response-mapper style
// in investors.service.ts: the backend returns camelCase (Prisma field names),
// the frontend works in snake_case.
const PATHFINDER_API_URL = `${process.env.DIRECTORY_API_URL}/v1/pathfinder`;

type AnyDto = Record<string, any>;

function mapHopChain(dto: AnyDto | null | undefined): PathHopChain {
  const nodes = ((dto?.nodes ?? []) as AnyDto[]).map((n) => ({
    id: n.id as string,
    label: n.label as string,
    type: (n.type ?? 'person') as 'person' | 'org',
  }));
  const edges = ((dto?.edges ?? []) as AnyDto[]).map((e) => ({
    from: e.from as string,
    to: e.to as string,
    connector_type: (e.connector_type ?? e.connectorType ?? '') as string,
    probability: (e.probability ?? 0) as number,
    evidence: (e.evidence ?? null) as string | null,
  }));
  return { nodes, edges, explanation: (dto?.explanation ?? '') as string };
}

function mapCorrection(dto: AnyDto): PathCorrection {
  return {
    id: dto.id as number,
    field: (dto.field ?? '') as string,
    old_value: dto.oldValue ?? null,
    new_value: dto.newValue ?? null,
    note: (dto.note ?? null) as string | null,
    actor_email: (dto.actorEmail ?? null) as string | null,
    created_at: (dto.createdAt ?? '') as string,
  };
}

export function mapPathfinderPath(dto: AnyDto): PathfinderPath {
  return {
    id: dto.id as number,
    target_investor_id: dto.targetInvestorId as string,
    connector_type: (dto.connectorType ?? 'C') as PathConnectorType,
    hops: (dto.hops ?? 0) as number,
    caliber: (dto.caliber ?? null) as PathCaliber | null,
    proximity_code: (dto.proximityCode ?? '') as string,
    score: (dto.score ?? 0) as number,
    caliber_confidence: dto.caliberConfidence ?? null,
    hop_chain: mapHopChain(dto.hopChain),
    rank: (dto.rank ?? 0) as number,
    computed_at: dto.computedAt ?? undefined,
    corrections: ((dto.corrections ?? []) as AnyDto[]).map(mapCorrection),
  };
}

/** All ranked warm paths for a single target investor (best first). */
export async function fetchPathsForTarget(investorId: string): Promise<PathsForTargetResponse> {
  const res = await customFetch(
    `${PATHFINDER_API_URL}/paths/${encodeURIComponent(investorId)}`,
    { method: 'GET' },
    true,
  );
  if (!res || !res.ok) return { target_investor_id: investorId, total: 0, paths: [] };
  const json = await res.json();
  return {
    target_investor_id: (json.targetInvestorId ?? investorId) as string,
    total: (json.total ?? 0) as number,
    paths: ((json.items ?? []) as AnyDto[]).map(mapPathfinderPath),
  };
}

/** Batch connector lens: of the given targets, which have a path routing
 *  through any of the given connector node labels. One request for the whole
 *  visible page (POST because the id list is too long for a query string). */
export async function fetchConnectorMatches(targetInvestorIds: string[], connectorLabels: string[]): Promise<string[]> {
  const res = await customFetch(
    `${PATHFINDER_API_URL}/connector-matches`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_investor_ids: targetInvestorIds, connector_labels: connectorLabels }),
    },
    true,
  );
  if (!res || !res.ok) return [];
  const json = await res.json();
  return ((json.matchedIds ?? []) as string[]).filter((id) => typeof id === 'string');
}

/** Persist an investment-team override (caliber / connector / path validity).
 *  Returns true on success. Gated server-side on investor_db.edit. */
export async function submitCorrection(input: CorrectionInput): Promise<boolean> {
  const res = await customFetch(
    `${PATHFINDER_API_URL}/corrections`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) },
    true,
  );
  return !!res && res.ok;
}
