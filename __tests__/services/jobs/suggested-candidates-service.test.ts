const mockFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({
  customFetch: (...args: unknown[]) => mockFetch(...args),
}));

import { selectShownSuggestions } from '@/schema/suggested-candidates';
import {
  fetchSuggestedCandidates,
  isApplicantsForbiddenError,
  TeamApplicantsError,
} from '@/services/jobs/team-applicants.service';

/**
 * LAB-2771: the transport and the contract for a role's suggested candidates,
 * which the backend serves at `GET /v1/job-openings/:roleUid/suggested-candidates`
 * (LAB-2770, `job-match.service.ts`).
 */

const suggestion = (rank: number, label = 'Strong match', over: Record<string, unknown> = {}) => ({
  memberUid: `m-${rank}`,
  name: `Person ${rank}`,
  role: 'Protocol Engineer',
  imageUrl: null,
  fit: 90 - rank,
  label,
  rank,
  blurb: null,
  criteria: [
    { text: 'Five years of Rust', matched: true },
    { text: 'Based in Europe', matched: false },
  ],
  ...over,
});

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const fail = (status: number, body: unknown = {}) => ({ ok: false, status, json: async () => body });

beforeEach(() => mockFetch.mockReset());

describe('fetchSuggestedCandidates', () => {
  it('reads the role’s suggestions with the session', async () => {
    mockFetch.mockResolvedValue(ok({ suggestions: [suggestion(1)] }));

    const rows = await fetchSuggestedCandidates('role/1');

    const [url, init, withAuth] = mockFetch.mock.calls[0];
    expect(url).toMatch(/\/v1\/job-openings\/role%2F1\/suggested-candidates$/);
    expect(init).toEqual({ method: 'GET' });
    expect(withAuth).toBe(true);
    expect(rows).toHaveLength(1);
    expect(rows[0].criteria).toEqual([
      { text: 'Five years of Rust', matched: true },
      { text: 'Based in Europe', matched: false },
    ]);
  });

  it('shows at most 5 people, best match first', async () => {
    mockFetch.mockResolvedValue(
      ok({ suggestions: [6, 3, 1, 5, 2, 4].map((rank) => suggestion(rank, rank > 3 ? 'Good match' : 'Strong match')) }),
    );

    const rows = await fetchSuggestedCandidates('role-1');

    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it('never shows a Weak match', async () => {
    mockFetch.mockResolvedValue(
      ok({ suggestions: [suggestion(1), suggestion(2, 'Weak match'), suggestion(3, 'Good match')] }),
    );

    const rows = await fetchSuggestedCandidates('role-1');

    expect(rows.map((row) => row.label)).toEqual(['Strong match', 'Good match']);
  });

  it('answers an empty list for a role with no suggestions', async () => {
    mockFetch.mockResolvedValue(ok({ suggestions: [] }));

    await expect(fetchSuggestedCandidates('role-1')).resolves.toEqual([]);
  });

  it('rejects a reader outside the team with a forbidden error', async () => {
    mockFetch.mockResolvedValue(fail(403, { message: 'Only hiring team members and directory admins' }));

    const error = await fetchSuggestedCandidates('role-1').catch((e) => e);

    expect(error).toBeInstanceOf(TeamApplicantsError);
    expect(isApplicantsForbiddenError(error)).toBe(true);
  });

  it('fails loudly on a field the contract does not know', async () => {
    mockFetch.mockResolvedValue(ok({ suggestions: [suggestion(1, 'Strong match', { surprise: true })] }));

    await expect(fetchSuggestedCandidates('role-1')).rejects.toThrow();
  });
});

describe('selectShownSuggestions', () => {
  it('keeps the server’s order when it is already ranked', () => {
    expect(selectShownSuggestions([suggestion(1), suggestion(2)]).map((row) => row.memberUid)).toEqual(['m-1', 'm-2']);
  });
});
