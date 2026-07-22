/** Lightweight hopChain parsers for Warm Intros v2 drawer (pl_direct shape). */

export type WarmPathV2HopNode = {
  profileUid: string;
  name: string;
  role?: string;
  score?: number;
};

export type WarmPathV2Alternate = {
  profileUid: string;
  name: string;
  score?: number;
  reasons?: unknown[];
};

export type WarmPathV2HopChain = {
  hops: WarmPathV2HopNode[];
  reasons: unknown[];
  alternates: WarmPathV2Alternate[];
  relationKind?: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

export function reasonDescription(reason: unknown): string | null {
  if (typeof reason === 'string' && reason.trim()) return reason.trim();
  const rec = asRecord(reason);
  if (!rec) return null;
  for (const key of ['description', 'text', 'reason', 'summary'] as const) {
    const v = rec[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

function parseHop(raw: unknown): WarmPathV2HopNode | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const profileUid = typeof rec.profileUid === 'string' ? rec.profileUid : null;
  if (!profileUid) return null;
  const name = typeof rec.name === 'string' && rec.name.trim() ? rec.name.trim() : profileUid;
  return {
    profileUid,
    name,
    role: typeof rec.role === 'string' ? rec.role : undefined,
    score: typeof rec.score === 'number' ? rec.score : undefined,
  };
}

function parseAlternate(raw: unknown): WarmPathV2Alternate | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const profileUid = typeof rec.profileUid === 'string' ? rec.profileUid : null;
  if (!profileUid) return null;
  return {
    profileUid,
    name: typeof rec.name === 'string' && rec.name.trim() ? rec.name.trim() : profileUid,
    score: typeof rec.score === 'number' ? rec.score : undefined,
    reasons: Array.isArray(rec.reasons) ? rec.reasons : undefined,
  };
}

export function parseWarmPathHopChain(hopChain: unknown): WarmPathV2HopChain | null {
  const chain = asRecord(hopChain);
  if (!chain) return null;

  const hops = Array.isArray(chain.hops)
    ? chain.hops.map(parseHop).filter((h): h is WarmPathV2HopNode => h != null)
    : [];

  const alternates = Array.isArray(chain.alternates)
    ? chain.alternates.map(parseAlternate).filter((a): a is WarmPathV2Alternate => a != null)
    : [];

  const reasons = Array.isArray(chain.reasons) ? chain.reasons : [];

  return {
    hops,
    reasons,
    alternates,
    relationKind: typeof chain.relationKind === 'string' ? chain.relationKind : undefined,
  };
}

export function explanationFromHopChain(hopChain: unknown, fallback: string | null = null): string | null {
  const chain = parseWarmPathHopChain(hopChain);
  if (!chain) return fallback;
  for (const r of chain.reasons) {
    const d = reasonDescription(r);
    if (d) return d;
  }
  return fallback;
}

export function affinityPersonUrl(affinityPersonId: string): string {
  return `https://protocol.affinity.co/persons/${encodeURIComponent(affinityPersonId)}`;
}

export function scoreToPercent(score: number | undefined | null): number | null {
  if (score == null || !Number.isFinite(score)) return null;
  if (score >= 0 && score <= 1) return Math.round(score * 100);
  return Math.round(score);
}
