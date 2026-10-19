const mockFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({
  customFetch: (...args: unknown[]) => mockFetch(...args),
}));

import { selectShownSuggestions, suggestedCandidatesResponseSchema } from '@/schema/suggested-candidates';
import {
  contactSuggestedCandidate,
  fetchSuggestedCandidates,
  isAlreadyContactedError,
  isApplicantsForbiddenError,
  saveMatchCriteria,
  SUGGESTED_ACTIONS_MOCKED,
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

    const { suggestions: rows } = await fetchSuggestedCandidates('role/1');

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

    const { suggestions: rows } = await fetchSuggestedCandidates('role-1');

    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it('never shows a Weak match', async () => {
    mockFetch.mockResolvedValue(
      ok({ suggestions: [suggestion(1), suggestion(2, 'Weak match'), suggestion(3, 'Good match')] }),
    );

    const { suggestions: rows } = await fetchSuggestedCandidates('role-1');

    expect(rows.map((row) => row.label)).toEqual(['Strong match', 'Good match']);
  });

  it('answers an empty list for a role with no suggestions', async () => {
    mockFetch.mockResolvedValue(ok({ suggestions: [] }));

    await expect(fetchSuggestedCandidates('role-1')).resolves.toEqual({
      suggestions: [],
      criteria: null,
      criteriaPrompt: null,
    });
  });

  it('rejects a reader outside the team with a forbidden error', async () => {
    mockFetch.mockResolvedValue(fail(403, { message: 'Only hiring team members and directory admins' }));

    const error = await fetchSuggestedCandidates('role-1').catch((e) => e);

    expect(error).toBeInstanceOf(TeamApplicantsError);
    expect(isApplicantsForbiddenError(error)).toBe(true);
  });

  it('accepts the interested flag the backend adds in LAB-2788', async () => {
    mockFetch.mockResolvedValue(
      ok({ suggestions: [suggestion(1, 'Strong match', { interested: true }), suggestion(2)] }),
    );

    const { suggestions: rows } = await fetchSuggestedCandidates('role-1');

    expect(rows.map((row) => row.interested)).toEqual([true, undefined]);
  });

  it('accepts the interested member’s note (LAB-2789)', async () => {
    mockFetch.mockResolvedValue(
      ok({
        suggestions: [
          suggestion(1, 'Strong match', { interested: true, note: 'Keen to help.' }),
          suggestion(2, 'Good match', { interested: true, note: null }),
          suggestion(3),
        ],
      }),
    );

    const { suggestions: rows } = await fetchSuggestedCandidates('role-1');

    expect(rows.map((row) => row.note)).toEqual(['Keen to help.', null, undefined]);
  });

  it('answers criteria null when an older backend sends none', async () => {
    mockFetch.mockResolvedValue(ok({ suggestions: [suggestion(1)] }));

    await expect(fetchSuggestedCandidates('role-1')).resolves.toMatchObject({ criteria: null });
  });

  it('answers the role’s criteria and each person’s contactedAt (LAB-2846)', async () => {
    mockFetch.mockResolvedValue(
      ok({
        suggestions: [suggestion(1, 'Strong match', { contactedAt: '2026-10-12T09:00:00.000Z' })],
        criteria: [{ text: 'Five years of Rust', enabled: false }],
      }),
    );

    const result = await fetchSuggestedCandidates('role-1');

    expect(result.criteria).toEqual([{ text: 'Five years of Rust', enabled: false }]);
    expect(result.suggestions[0].contactedAt).toBe('2026-10-12T09:00:00.000Z');
  });

  it('keeps an empty criteria list apart from a missing one', async () => {
    mockFetch.mockResolvedValue(ok({ suggestions: [], criteria: [] }));

    await expect(fetchSuggestedCandidates('role-1')).resolves.toEqual({
      suggestions: [],
      criteria: [],
      criteriaPrompt: null,
    });
  });

  it('answers the lead’s saved criteria prompt (LAB-2853)', async () => {
    mockFetch.mockResolvedValue(
      ok({ suggestions: [], criteria: [{ text: 'A', enabled: true }], criteriaPrompt: 'Ran a storage network' }),
    );

    await expect(fetchSuggestedCandidates('role-1')).resolves.toMatchObject({
      criteriaPrompt: 'Ran a storage network',
    });
  });

  it('answers criteriaPrompt null when the backend sends null or nothing', async () => {
    mockFetch.mockResolvedValueOnce(ok({ suggestions: [], criteriaPrompt: null }));
    await expect(fetchSuggestedCandidates('role-1')).resolves.toMatchObject({ criteriaPrompt: null });

    mockFetch.mockResolvedValueOnce(ok({ suggestions: [] }));
    await expect(fetchSuggestedCandidates('role-1')).resolves.toMatchObject({ criteriaPrompt: null });
  });

  it('fails loudly on a field the contract does not know', async () => {
    mockFetch.mockResolvedValue(ok({ suggestions: [suggestion(1, 'Strong match', { surprise: true })] }));

    await expect(fetchSuggestedCandidates('role-1')).rejects.toThrow();
  });
});

/**
 * LAB-2847: the two writes (backend #3509). `customFetch` sends no
 * Content-Type of its own, so every JSON body must carry one or the API
 * answers 415 before the handler runs.
 */
describe('the Suggested tab’s writes', () => {
  it('talks to the real API by default', () => {
    expect(SUGGESTED_ACTIONS_MOCKED).toBe(false);
  });

  describe('saveMatchCriteria', () => {
    it('PUTs the switched-off texts and the prompt as JSON and answers both as saved', async () => {
      const saved = [
        { text: 'A', enabled: true },
        { text: 'B', enabled: false },
      ];
      mockFetch.mockResolvedValue(ok({ criteria: saved, prompt: 'Ran a storage network' }));

      const result = await saveMatchCriteria('role/1', ['B'], 'Ran a storage network');

      const [url, init, withAuth] = mockFetch.mock.calls[0];
      expect(url).toMatch(/\/v1\/job-openings\/role%2F1\/match-criteria$/);
      expect(init.method).toBe('PUT');
      expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(JSON.parse(init.body)).toEqual({ disabled: ['B'], prompt: 'Ran a storage network' });
      expect(withAuth).toBe(true);
      expect(result).toEqual({ criteria: saved, prompt: 'Ran a storage network' });
    });

    /* Absent `prompt` means "keep the saved one" on the endpoint, so the modal
       clears it with an explicit null, and the key must survive serialising. */
    it('sends prompt null explicitly to clear it', async () => {
      mockFetch.mockResolvedValue(ok({ criteria: [{ text: 'A', enabled: true }], prompt: null }));

      const result = await saveMatchCriteria('role-1', [], null);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toHaveProperty('prompt', null);
      expect(result.prompt).toBeNull();
    });

    it('answers prompt null from a backend that does not send one', async () => {
      mockFetch.mockResolvedValue(ok({ criteria: [{ text: 'A', enabled: true }] }));

      await expect(saveMatchCriteria('role-1', [], 'Kept by nobody')).resolves.toEqual({
        criteria: [{ text: 'A', enabled: true }],
        prompt: null,
      });
    });

    it.each([400, 403, 404, 409, 500])(
      'throws a TeamApplicantsError with the server’s message on %i',
      async (status) => {
        mockFetch.mockResolvedValue(fail(status, { message: `refused ${status}` }));

        const error = await saveMatchCriteria('role-1', ['B'], null).catch((e) => e);

        expect(error).toBeInstanceOf(TeamApplicantsError);
        expect(error.status).toBe(status);
        expect(error.message).toBe(`refused ${status}`);
        expect(isApplicantsForbiddenError(error)).toBe(status === 403);
      },
    );

    it('fails on an answer that drifts from the contract', async () => {
      mockFetch.mockResolvedValue(ok({ criteria: [{ text: 'A', enabled: true, id: 'x' }] }));

      await expect(saveMatchCriteria('role-1', [], null)).rejects.toThrow();
    });
  });

  describe('contactSuggestedCandidate', () => {
    it('POSTs the message as JSON and answers contactedAt', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ contactedAt: '2026-10-13T10:00:00.000Z' }),
      });

      const result = await contactSuggestedCandidate('role/1', 'm/1', 'Hi Ana');

      const [url, init, withAuth] = mockFetch.mock.calls[0];
      expect(url).toMatch(/\/v1\/job-openings\/role%2F1\/suggested-candidates\/m%2F1\/contact$/);
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(JSON.parse(init.body)).toEqual({ message: 'Hi Ana' });
      expect(withAuth).toBe(true);
      expect(result).toEqual({ contactedAt: '2026-10-13T10:00:00.000Z' });
    });

    it('names a 409 as already contacted', async () => {
      mockFetch.mockResolvedValue(fail(409, { message: 'Already contacted' }));

      const error = await contactSuggestedCandidate('role-1', 'm-1', 'Hi').catch((e) => e);

      expect(error).toBeInstanceOf(TeamApplicantsError);
      expect(isAlreadyContactedError(error)).toBe(true);
    });

    it.each([400, 403, 404, 500])(
      'throws a TeamApplicantsError that is not "already contacted" on %i',
      async (status) => {
        mockFetch.mockResolvedValue(fail(status, { message: `refused ${status}` }));

        const error = await contactSuggestedCandidate('role-1', 'm-1', 'Hi').catch((e) => e);

        expect(error).toBeInstanceOf(TeamApplicantsError);
        expect(error.status).toBe(status);
        expect(error.message).toBe(`refused ${status}`);
        expect(isAlreadyContactedError(error)).toBe(false);
      },
    );

    it('falls back to its own message when the server sent none', async () => {
      mockFetch.mockResolvedValue(fail(500));

      const error = await contactSuggestedCandidate('role-1', 'm-1', 'Hi').catch((e) => e);

      expect(error.message).toBe('Could not send your message. Please try again.');
    });
  });
});

/**
 * LAB-2847: the backend (LAB-2846) adds `contactedAt` per person and the
 * role's `criteria` list. The page must read both the older and the newer
 * response, and still refuse a field it has never heard of.
 */
describe('suggestedCandidatesResponseSchema with the LAB-2846 fields', () => {
  it('reads an older response without contactedAt or criteria', () => {
    const parsed = suggestedCandidatesResponseSchema.parse({ suggestions: [suggestion(1)] });

    expect(parsed.criteria).toBeUndefined();
    expect(parsed.suggestions[0].contactedAt).toBeUndefined();
  });

  it('reads a newer response with contactedAt and the role’s criteria', () => {
    const parsed = suggestedCandidatesResponseSchema.parse({
      suggestions: [
        suggestion(1, 'Strong match', { contactedAt: '2026-10-12T09:00:00.000Z' }),
        suggestion(2, 'Good match', { contactedAt: null }),
      ],
      criteria: [
        { text: 'Five years of Rust', enabled: true },
        { text: 'Based in Europe', enabled: false },
      ],
    });

    expect(parsed.suggestions.map((row) => row.contactedAt)).toEqual(['2026-10-12T09:00:00.000Z', null]);
    expect(parsed.criteria).toEqual([
      { text: 'Five years of Rust', enabled: true },
      { text: 'Based in Europe', enabled: false },
    ]);
  });

  it('still fails on an unknown field, on a person or on a criterion', () => {
    expect(() =>
      suggestedCandidatesResponseSchema.parse({ suggestions: [suggestion(1, 'Strong match', { surprise: 1 })] }),
    ).toThrow();
    expect(() =>
      suggestedCandidatesResponseSchema.parse({
        suggestions: [],
        criteria: [{ text: 'Five years of Rust', enabled: true, id: 'c1' }],
      }),
    ).toThrow();
    expect(() => suggestedCandidatesResponseSchema.parse({ suggestions: [], surprise: true })).toThrow();
  });

  it('reads criteriaPrompt as a string, null, or absent (LAB-2853)', () => {
    expect(
      suggestedCandidatesResponseSchema.parse({ suggestions: [], criteriaPrompt: 'Ran a storage network' }),
    ).toMatchObject({ criteriaPrompt: 'Ran a storage network' });
    expect(suggestedCandidatesResponseSchema.parse({ suggestions: [], criteriaPrompt: null })).toMatchObject({
      criteriaPrompt: null,
    });
    expect(suggestedCandidatesResponseSchema.parse({ suggestions: [] }).criteriaPrompt).toBeUndefined();
  });
});

/**
 * LAB-2854: criteria gain an optional short `label` and a `group`. Both are
 * optional so an older backend parses, and a group this page has never heard
 * of is read as Other rather than failing the whole tab.
 */
describe('suggestedCandidatesResponseSchema with structured criteria (LAB-2854)', () => {
  const withCriterion = (roleCriterion: Record<string, unknown>, personCriterion: Record<string, unknown>) =>
    suggestedCandidatesResponseSchema.parse({
      suggestions: [suggestion(1, 'Strong match', { criteria: [personCriterion] })],
      criteria: [roleCriterion],
    });

  it('reads label and group on both criterion shapes', () => {
    const parsed = withCriterion(
      { text: 'Five years of Rust', enabled: true, label: 'Rust', group: 'Skills' },
      { text: 'Five years of Rust', matched: false, label: 'Rust', group: 'Skills' },
    );

    expect(parsed.criteria).toEqual([{ text: 'Five years of Rust', enabled: true, label: 'Rust', group: 'Skills' }]);
    expect(parsed.suggestions[0].criteria).toEqual([
      { text: 'Five years of Rust', matched: false, label: 'Rust', group: 'Skills' },
    ]);
  });

  it('reads criteria without label or group, as an older backend sends them', () => {
    const parsed = withCriterion({ text: 'A', enabled: true }, { text: 'A', matched: true });

    expect(parsed.criteria).toEqual([{ text: 'A', enabled: true }]);
    expect(parsed.suggestions[0].criteria).toEqual([{ text: 'A', matched: true }]);
  });

  it('reads an unknown group as Other instead of failing', () => {
    const parsed = withCriterion(
      { text: 'A', enabled: true, group: 'Education' },
      { text: 'A', matched: true, group: 42 },
    );

    expect(parsed.criteria?.[0].group).toBe('Other');
    expect(parsed.suggestions[0].criteria[0].group).toBe('Other');
  });

  it('reads a null group or label as no group and no label', () => {
    const parsed = withCriterion(
      { text: 'A', enabled: true, label: null, group: null },
      { text: 'A', matched: true, group: null },
    );

    expect(parsed.criteria?.[0].group).toBeUndefined();
    expect(parsed.criteria?.[0].label).toBeNull();
    expect(parsed.suggestions[0].criteria[0].group).toBeUndefined();
  });

  it('still fails on an unknown field beside them', () => {
    expect(() =>
      withCriterion({ text: 'A', enabled: true, group: 'Skills', weight: 2 }, { text: 'A', matched: true }),
    ).toThrow();
  });
});

describe('selectShownSuggestions', () => {
  it('keeps the server’s order when it is already ranked', () => {
    expect(selectShownSuggestions([suggestion(1), suggestion(2)]).map((row) => row.memberUid)).toEqual(['m-1', 'm-2']);
  });
});
