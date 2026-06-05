import { customFetch } from '@/utils/fetch-wrapper';
import { DEFAULT_PAGE_SIZE } from './constants';
import type { FounderDetail, FounderFiltersResponse, FounderListParams, FounderListResponse, KpiSummary, ReviewFounderPayload } from './types';

const BASE = `${process.env.DIRECTORY_API_URL}/v1/founder-sourcing`;

function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === 0) continue;
    if (Array.isArray(v)) {
      if (v.length > 0) qs.set(k, v.join(','));
    } else {
      qs.set(k, String(v));
    }
  }
  return qs.toString();
}

export async function fetchFounders(params: FounderListParams): Promise<FounderListResponse> {
  const qs = buildQuery({ ...params, limit: params.limit ?? DEFAULT_PAGE_SIZE });
  const res = await customFetch(`${BASE}/founders?${qs}`, { method: 'GET' }, true);
  if (!res?.ok) return { page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, items: [] };
  return res.json();
}

export async function fetchFounderById(id: string): Promise<FounderDetail | null> {
  const res = await customFetch(`${BASE}/founders/${id}`, { method: 'GET' }, true);
  if (!res?.ok) return null;
  return res.json();
}

export async function fetchFoundersKpiSummary(weeks = 4): Promise<KpiSummary | null> {
  const res = await customFetch(`${BASE}/kpis/summary?weeks=${weeks}`, { method: 'GET' }, true);
  if (!res?.ok) return null;
  return res.json();
}

export async function fetchFounderFilters(): Promise<FounderFiltersResponse | null> {
  const res = await customFetch(`${BASE}/filters`, { method: 'GET' }, true);
  if (!res?.ok) return null;
  return res.json();
}

export async function reviewFounder(id: string, body: ReviewFounderPayload): Promise<void> {
  const res = await customFetch(
    `${BASE}/founders/${id}/review`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    true,
  );
  if (!res?.ok) throw new Error(`Review failed: ${res?.status}`);
}
