/**
 * Pure display helpers for MasterProfile modal (S3-T6).
 * Mirrors portal enrich util tolerance for Sourced wrappers / loose JSON.
 */

import {
  WARM_INTROS_V2_TARGET_SET_LABEL,
  type WarmIntrosV2TargetSet,
} from '@/services/investors/warm-intros-v2.types';

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Unwrap Sourced<T> or plain T → T | null. */
export function unwrapSourcedValue<T = unknown>(item: unknown): T | null {
  if (item == null) return null;
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    return item as T;
  }
  const rec = asRecord(item);
  if (!rec || !('value' in rec)) return null;
  return (rec.value as T) ?? null;
}

/** Unwrap Sourced<T>[] | T[] → T[] (strings trimmed when string). */
export function unwrapSourcedArray(raw: unknown): string[] {
  if (raw == null) return [];
  if (typeof raw === 'string') {
    const t = raw.trim();
    return t ? [t] : [];
  }
  if (!Array.isArray(raw)) {
    const single = unwrapSourcedValue(raw);
    if (isNonEmptyString(single)) return [single.trim()];
    return [];
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    let s: string | null = null;
    if (typeof item === 'string') s = item.trim();
    else {
      const v = unwrapSourcedValue(item);
      if (isNonEmptyString(v)) s = v.trim();
    }
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

const SOCIAL_KEYS = ['linkedin', 'twitter', 'github', 'website', 'blog', 'telegram'] as const;

export type SocialLink = { provider: string; url: string };

/**
 * Normalize socials: Record<provider, Sourced<string>|string> or Sourced<Record>.
 */
export function unwrapSocials(socials: unknown): SocialLink[] {
  if (socials == null) return [];

  let map: Record<string, unknown> | null = asRecord(socials);
  if (!map) return [];

  // Sourced<Record<string, string>>
  if ('value' in map && asRecord(map.value)) {
    map = asRecord(map.value);
  }
  if (!map) return [];

  const out: SocialLink[] = [];
  const preferred = SOCIAL_KEYS.filter((k) => k in map!);
  const rest = Object.keys(map).filter((k) => !preferred.includes(k as (typeof SOCIAL_KEYS)[number]));
  for (const provider of [...preferred, ...rest]) {
    const raw = map[provider];
    let url: string | null = null;
    if (isNonEmptyString(raw)) url = raw.trim();
    else {
      const v = unwrapSourcedValue(raw);
      if (isNonEmptyString(v)) url = v.trim();
    }
    if (!url) continue;
    out.push({ provider, url: ensureHref(url) });
  }
  return out;
}

function ensureHref(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('mailto:') || url.startsWith('tel:')) return url;
  return `https://${url}`;
}

export type ExperienceItem = {
  company: string | null;
  title: string | null;
  years: string | null;
};

export type EducationItem = {
  school: string | null;
  degree: string | null;
  year: string | null;
};

function yearRange(start: unknown, end: unknown): string | null {
  const s = start != null && String(start).trim() ? String(start).trim() : null;
  const e = end != null && String(end).trim() ? String(end).trim() : null;
  if (s && e) return `${s}–${e}`;
  if (s) return `${s}–present`;
  if (e) return e;
  return null;
}

function pickString(rec: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = rec[key];
    if (isNonEmptyString(v)) return v.trim();
  }
  return null;
}

/** Safe list of experience rows for display. */
export function parseExperience(raw: unknown): ExperienceItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: ExperienceItem[] = [];
  for (const item of raw) {
    if (isNonEmptyString(item)) {
      out.push({ company: item.trim(), title: null, years: null });
      continue;
    }
    const rec = asRecord(item);
    if (!rec) continue;
    const company = pickString(rec, ['company', 'name', 'org', 'organization']);
    const title = pickString(rec, ['title', 'role', 'position']);
    const years =
      pickString(rec, ['years', 'year', 'dates', 'dateRange']) ||
      yearRange(rec.startYear ?? rec.start, rec.endYear ?? rec.end);
    if (!company && !title) continue;
    out.push({ company, title, years });
  }
  return out;
}

/** Safe list of education rows for display. */
export function parseEducation(raw: unknown): EducationItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: EducationItem[] = [];
  for (const item of raw) {
    if (isNonEmptyString(item)) {
      out.push({ school: item.trim(), degree: null, year: null });
      continue;
    }
    const rec = asRecord(item);
    if (!rec) continue;
    const school = pickString(rec, ['school', 'name', 'institution', 'university']);
    const degree = pickString(rec, ['degree', 'field', 'program']);
    const year =
      pickString(rec, ['year', 'years', 'dates', 'dateRange']) ||
      yearRange(rec.startYear ?? rec.start, rec.endYear ?? rec.end);
    if (!school && !degree) continue;
    out.push({ school, degree, year });
  }
  return out;
}

/** Organization labels from organizations[] (or string[]). */
export function parseOrganizationLabels(raw: unknown): string[] {
  if (raw == null) return [];
  if (isNonEmptyString(raw)) return [raw.trim()];
  if (!Array.isArray(raw)) {
    const rec = asRecord(raw);
    if (!rec) return [];
    const label = pickString(rec, ['name', 'company', 'org', 'organization']);
    return label ? [label] : [];
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    let label: string | null = null;
    if (isNonEmptyString(item)) label = item.trim();
    else {
      const rec = asRecord(item);
      if (rec) label = pickString(rec, ['name', 'company', 'org', 'organization']);
    }
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

/** Location labels from locations[] / string / object. */
export function parseLocationLabels(raw: unknown): string[] {
  if (raw == null) return [];
  if (isNonEmptyString(raw)) return [raw.trim()];
  if (!Array.isArray(raw)) {
    const rec = asRecord(raw);
    if (!rec) return [];
    const label = pickString(rec, ['name', 'label', 'city', 'location', 'value']);
    return label ? [label] : [];
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    let label: string | null = null;
    if (isNonEmptyString(item)) label = item.trim();
    else {
      const rec = asRecord(item);
      if (rec) {
        const parts = [
          pickString(rec, ['city']),
          pickString(rec, ['region', 'state']),
          pickString(rec, ['country']),
        ].filter(Boolean);
        label =
          parts.length > 0
            ? parts.join(', ')
            : pickString(rec, ['name', 'label', 'location', 'value']);
      }
    }
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

export type ListMembershipDisplay = { slug: string; label: string };

export function parseListMemberships(raw: unknown): ListMembershipDisplay[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: ListMembershipDisplay[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const rec = asRecord(item);
    if (!rec) continue;
    const slug =
      pickString(rec, ['listSlug', 'slug']) ||
      pickString(rec, ['listId', 'listName', 'name']) ||
      '';
    if (!slug) continue;
    const key = slug.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const named = pickString(rec, ['listName', 'name']);
    const known = WARM_INTROS_V2_TARGET_SET_LABEL[slug as WarmIntrosV2TargetSet];
    out.push({ slug, label: known || named || slug });
  }
  return out;
}

export type InvestorMetaField = { label: string; value: string };

const INVESTOR_META_KEYS: Array<{ key: string; label: string }> = [
  { key: 'firm', label: 'Firm' },
  { key: 'investorType', label: 'Investor type' },
  { key: 'type', label: 'Type' },
  { key: 'aum', label: 'AUM' },
  { key: 'aumUsd', label: 'AUM (USD)' },
  { key: 'stages', label: 'Stages' },
  { key: 'stage', label: 'Stage' },
  { key: 'checkSize', label: 'Check size' },
  { key: 'sectors', label: 'Sectors' },
  { key: 'notableInvestments', label: 'Notable investments' },
  { key: 'thesis', label: 'Thesis' },
  { key: 'focus', label: 'Focus' },
];

function formatMetaValue(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    const s = String(v).trim();
    return s || null;
  }
  if (Array.isArray(v)) {
    const parts = unwrapSourcedArray(v);
    return parts.length ? parts.join(', ') : null;
  }
  const sourced = unwrapSourcedValue(v);
  if (sourced != null && sourced !== v) return formatMetaValue(sourced);
  return null;
}

/** Flatten investorMeta into labeled rows (skip empty / unknown huge blobs). */
export function parseInvestorMetaFields(investorMeta: unknown): InvestorMetaField[] {
  const meta = asRecord(investorMeta);
  if (!meta) return [];
  const out: InvestorMetaField[] = [];
  const used = new Set<string>();

  for (const { key, label } of INVESTOR_META_KEYS) {
    if (!(key in meta)) continue;
    const value = formatMetaValue(meta[key]);
    if (!value) continue;
    used.add(key);
    out.push({ label, value });
  }

  for (const [key, raw] of Object.entries(meta)) {
    if (used.has(key)) continue;
    if (key.startsWith('_')) continue;
    const value = formatMetaValue(raw);
    if (!value) continue;
    // Skip very long free-form blobs in the flat list
    if (value.length > 400) continue;
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
    out.push({ label, value });
  }
  return out;
}

function collectLabels(raw: unknown, preferredKeys: string[]): string[] {
  if (raw == null) return [];
  if (isNonEmptyString(raw)) return [raw.trim()];
  if (!Array.isArray(raw)) {
    const rec = asRecord(raw);
    if (!rec) return [];
    const label = pickString(rec, preferredKeys);
    return label ? [label] : [];
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    let label: string | null = null;
    if (isNonEmptyString(item)) label = item.trim();
    else {
      const rec = asRecord(item);
      if (rec) label = pickString(rec, preferredKeys);
    }
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

export function projectsFromProfile(profile: {
  projects?: unknown;
  raw?: unknown;
}): string[] {
  if (profile.projects != null) return collectLabels(profile.projects, ['name', 'project', 'title']);
  const raw = asRecord(profile.raw);
  return collectLabels(raw?.projects, ['name', 'project', 'title']);
}

export function eventsFromProfile(profile: {
  events?: unknown;
  raw?: unknown;
}): string[] {
  if (profile.events != null) return collectLabels(profile.events, ['name', 'event', 'title']);
  const raw = asRecord(profile.raw);
  return collectLabels(raw?.events, ['name', 'event', 'title']);
}

export type SourceSnapshotSummary = { key: string; type: string | null };

/** Summarize sourceSnapshots keys / types without dumping payloads. */
export function summarizeSourceSnapshots(raw: unknown): SourceSnapshotSummary[] {
  const map = asRecord(raw);
  if (!map) return [];
  return Object.entries(map).map(([key, value]) => {
    const rec = asRecord(value);
    const type =
      (rec && pickString(rec, ['sourceType', 'type'])) ||
      (isNonEmptyString(value) ? value.trim() : null);
    return { key, type };
  });
}

export function typeLabel(type: string): string {
  switch (type) {
    case 'pl_internal':
      return 'PL internal';
    case 'investor':
      return 'Investor';
    case 'founder':
      return 'Founder';
    default:
      return type.replace(/_/g, ' ');
  }
}
