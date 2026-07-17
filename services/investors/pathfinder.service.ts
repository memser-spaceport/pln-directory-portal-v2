import { customFetch } from '@/utils/fetch-wrapper';
import type {
  CorrectionInput,
  PathCaliber,
  PathConnectorType,
  PathContact,
  PathCorrection,
  PathHopChain,
  PathOrgConnector,
  PathfinderPath,
  PathsForTargetResponse,
  RouteNode,
} from './types';

// PL Path Finder read + corrections API. Reuses the Investor DB permissions
// (investor_db.view / .edit) — no new perms. Mirrors the response-mapper style
// in investors.service.ts: the backend returns camelCase (Prisma field names),
// the frontend works in snake_case.
const PATHFINDER_API_URL = `${process.env.DIRECTORY_API_URL}/v1/pathfinder`;

type AnyDto = Record<string, any>;

export function mapHopNode(n: AnyDto): PathHopChain['nodes'][number] {
  const type = (n.type ?? 'person') as 'person' | 'org';
  // Coerce empty-string → undefined so discriminated union arms are satisfied.
  const memberUid = ((n.memberUid || n.member_uid) as string | undefined) || undefined;
  const teamUid = ((n.teamUid || n.team_uid) as string | undefined) || undefined;
  const id = n.id as string;
  const label = n.label as string;
  if (type === 'person' && memberUid) {
    return { id, label, type: 'person', member_uid: memberUid };
  }
  if (type === 'org' && teamUid) {
    return { id, label, type: 'org', team_uid: teamUid };
  }
  if (type === 'org') {
    return { id, label, type: 'org' };
  }
  return { id, label, type: 'person' };
}

/** Normalize LinkedIn handle or URL to an https profile URL (seed stores `linkedin` as handle). */
export function normalizeLinkedInUrl(value: string | null | undefined): string | undefined {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  const handle = raw
    .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '')
    .replace(/^linkedin\.com\/in\//i, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
  if (!handle) return undefined;
  return `https://www.linkedin.com/in/${handle}`;
}

function mapContact(dto: AnyDto): PathContact {
  return {
    id: dto.id as string | undefined,
    name: (dto.name ?? '') as string,
    role: dto.role as string | undefined,
    email: dto.email as string | undefined,
    image_url: (dto.imageUrl ?? dto.image_url) as string | undefined,
    linkedin_url: normalizeLinkedInUrl((dto.linkedinUrl ?? dto.linkedin_url ?? dto.linkedin) as string | undefined),
    telegram: dto.telegram as string | undefined,
    member_uid: (dto.memberUid ?? dto.member_uid) as string | undefined,
  };
}

function mapOrgConnector(dto: AnyDto): PathOrgConnector {
  return {
    id: dto.id as string | undefined,
    name: (dto.name ?? '') as string,
    domain: dto.domain as string | undefined,
    website_url: (dto.websiteUrl ?? dto.website_url ?? dto.website) as string | undefined,
    logo_url: (dto.logoUrl ?? dto.logo_url) as string | undefined,
    team_uid: (dto.teamUid ?? dto.team_uid) as string | undefined,
  };
}

function mapRouteNode(dto: AnyDto): RouteNode {
  const rawVariant = (dto.variant ?? 'external') as string;
  const variant: RouteNode['variant'] = rawVariant === 'member' || rawVariant === 'org' ? rawVariant : 'external';
  return {
    label: (dto.label ?? '') as string,
    role: dto.role as string | undefined,
    email: dto.email as string | undefined,
    variant,
    imageUrl: (dto.imageUrl ?? dto.image_url) as string | undefined,
    linkedin: dto.linkedin as string | undefined,
    memberUid: (dto.memberUid ?? dto.member_uid) as string | undefined,
    orgName: (dto.orgName ?? dto.org_name) as string | undefined,
    logo: dto.logo as string | undefined,
    teamUid: (dto.teamUid ?? dto.team_uid) as string | undefined,
    contacts: (dto.contacts as AnyDto[] | undefined)?.map((c) => ({
      name: (c.name ?? '') as string,
      role: c.role as string | undefined,
      email: c.email as string | undefined,
      source: c.source as string | undefined,
      imageUrl: (c.imageUrl ?? c.image_url) as string | undefined,
      linkedin: c.linkedin as string | undefined,
      memberUid: (c.memberUid ?? c.member_uid) as string | undefined,
    })),
  };
}

function mapHopChain(dto: AnyDto | null | undefined): PathHopChain {
  const nodes = ((dto?.nodes ?? []) as AnyDto[]).map(mapHopNode);
  const routeNodes = dto?.routeNodes ? (dto.routeNodes as AnyDto[]).map(mapRouteNode) : undefined;
  const edges = ((dto?.edges ?? []) as AnyDto[]).map((e) => ({
    from: e.from as string,
    to: e.to as string,
    connector_type: (e.connector_type ?? e.connectorType ?? '') as string,
    probability: (e.probability ?? 0) as number,
    evidence: (e.evidence ?? null) as string | null,
  }));
  const rawLines = (dto?.attributionLines ?? dto?.attribution_lines) as AnyDto[] | undefined;
  const attribution_lines = Array.isArray(rawLines)
    ? rawLines
        .map((line) => {
          const source = line?.source as string | undefined;
          const text = typeof line?.text === 'string' ? line.text.trim() : '';
          if ((source !== 'Affinity' && source !== 'LinkedIn') || !text) return null;
          return { source: source as 'Affinity' | 'LinkedIn', text };
        })
        .filter((line): line is { source: 'Affinity' | 'LinkedIn'; text: string } => line != null)
    : undefined;
  return {
    nodes,
    routeNodes,
    edges,
    explanation: (dto?.explanation ?? '') as string,
    ...(attribution_lines && attribution_lines.length > 0 ? { attribution_lines } : {}),
  };
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
  const hop_chain = mapHopChain(dto.hopChain);
  let contact = dto.hopChain?.contact ? mapContact(dto.hopChain.contact as AnyDto) : undefined;
  // Seed often stores LinkedIn on routeNodes / contact.linkedin (handle); prefer contact, else match route node.
  if (contact && !contact.linkedin_url && hop_chain.routeNodes?.length) {
    const byUid = contact.member_uid
      ? hop_chain.routeNodes.find((n) => n.memberUid === contact!.member_uid)
      : undefined;
    const byName = hop_chain.routeNodes.find(
      (n) => n.label.trim().toLowerCase() === contact!.name.trim().toLowerCase(),
    );
    const linkedin = normalizeLinkedInUrl(byUid?.linkedin ?? byName?.linkedin);
    if (linkedin) contact = { ...contact, linkedin_url: linkedin };
  }

  return {
    id: dto.id as number,
    target_investor_id: dto.targetInvestorId as string,
    target_set: dto.targetSet as string | undefined,
    connector_type: (dto.connectorType ?? 'C') as PathConnectorType,
    hops: (dto.hops ?? 0) as number,
    caliber: (dto.caliber ?? null) as PathCaliber | null,
    proximity_code: (dto.proximityCode ?? '') as string,
    score: (dto.score ?? 0) as number,
    caliber_confidence: dto.caliberConfidence ?? null,
    hop_chain,
    rank: (dto.rank ?? 0) as number,
    computed_at: dto.computedAt ?? undefined,
    corrections: ((dto.corrections ?? []) as AnyDto[]).map(mapCorrection),
    contact,
    org_connector: dto.hopChain?.orgConnector ? mapOrgConnector(dto.hopChain.orgConnector as AnyDto) : undefined,
  };
}

// ─── Best-path / best-connector resolution (pure, unit-tested) ──────────────────
//
// The summary graph and the rank-1 card both need "the best path". Resolve it
// here, off `rank === 1`, NOT `paths[0]` — array order is not guaranteed to equal
// rank order, and ranks can tie. Pure functions so they're testable in isolation
// and the two surfaces stay in agreement.

const pathScore = (p: PathfinderPath): number => (Number.isFinite(p.score) ? p.score : -Infinity);

/** Best (rank-1) path for a target: prefer `rank === 1`, else highest score then
 *  fewest hops. null for an empty list. Never mutates the input (the React Query
 *  array is shared — sorting a copy). */
export function resolveBestPath(paths: PathfinderPath[]): PathfinderPath | null {
  if (!paths.length) return null;
  return (
    paths.find((p) => p.rank === 1) ?? [...paths].sort((a, b) => pathScore(b) - pathScore(a) || a.hops - b.hops)[0]
  );
}

/** The connector shown inside the Protocol Labs node. Tagged union so the graph
 *  renders off a clean discriminant and the "plain Protocol Labs" fallback is a
 *  representable state, not an implicit null. */
export type BestConnector =
  | { kind: 'contact'; contact: PathContact }
  | { kind: 'org'; org: PathOrgConnector }
  | { kind: 'none' };

export function resolveBestConnector(path: PathfinderPath | null): BestConnector {
  if (path?.contact) return { kind: 'contact', contact: path.contact };
  if (path?.org_connector) return { kind: 'org', org: path.org_connector };
  return { kind: 'none' };
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
export async function fetchConnectorMatches(
  targetInvestorIds: string[],
  connectorLabels: string[],
  connectorLabelsContains: string[] = [],
): Promise<string[]> {
  const res = await customFetch(
    `${PATHFINDER_API_URL}/connector-matches`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_investor_ids: targetInvestorIds,
        connector_labels: connectorLabels,
        connector_labels_contains: connectorLabelsContains,
      }),
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
