import { customFetch } from '@/utils/fetch-wrapper';
import {
  mockFindWarmIntros,
  mockGetCoInvestorTeams,
  mockGetInvestorById,
  mockGetInvestors,
} from './investors.mock';
import type {
  InvestorListParams,
  InvestorListResponse,
  OutreachInvestor,
  PlPortfolioTeam,
  WarmIntrosParams,
  WarmIntrosResponse,
} from './types';

// Path matches the backend table name `InvestorOutreachRecord` per AGENTS.md
// rule #17 (module/route name matches persisted entity). Final exact path is
// negotiable with Vova when read endpoints land — change here if needed.
const INVESTORS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/investor-outreach`;

// Default to mock unless explicitly turned off. Real backend wiring lands when
// Vova ships the API; flip NEXT_PUBLIC_INVESTOR_DB_USE_MOCK=0 to swap.
function useMock(): boolean {
  return process.env.NEXT_PUBLIC_INVESTOR_DB_USE_MOCK !== '0';
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(key, value.join(','));
    } else if (typeof value === 'boolean') {
      if (value) search.set(key, 'true');
    } else {
      search.set(key, String(value));
    }
  });
  return search.toString();
}

/**
 * Single endpoint for the investor table — used by All / In Network /
 * Co-investors tabs. The tab determines which default flags to send
 * (in_lab_os=true for In Network, is_co_investor=true for Co-investors).
 */
export async function fetchInvestors(params: InvestorListParams): Promise<InvestorListResponse<OutreachInvestor>> {
  if (useMock()) return mockGetInvestors(params);
  const qs = buildQuery(params as Record<string, unknown>);
  const res = await customFetch(`${INVESTORS_API_URL}/investors?${qs}`, { method: 'GET' }, true);
  if (!res || !res.ok) return { page: 1, limit: 0, total: 0, items: [] };
  return res.json();
}

export async function fetchCoInvestorTeams(): Promise<PlPortfolioTeam[]> {
  if (useMock()) return mockGetCoInvestorTeams();
  const res = await customFetch(`${INVESTORS_API_URL}/co-investors/by-team`, { method: 'GET' }, true);
  if (!res || !res.ok) return [];
  return res.json();
}

export async function fetchInvestorById(id: string): Promise<OutreachInvestor | null> {
  if (useMock()) return mockGetInvestorById(id);
  const res = await customFetch(`${INVESTORS_API_URL}/investors/${encodeURIComponent(id)}`, { method: 'GET' }, true);
  if (!res || !res.ok) return null;
  return res.json();
}

export async function findWarmIntros(params: WarmIntrosParams): Promise<WarmIntrosResponse> {
  if (useMock()) return mockFindWarmIntros(params);
  const qs = buildQuery(params as Record<string, unknown>);
  const res = await customFetch(`${INVESTORS_API_URL}/warm-intros?${qs}`, { method: 'GET' }, true);
  if (!res || !res.ok) return { total: 0, candidates: [] };
  return res.json();
}
