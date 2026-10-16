import {
  contactSuggestedCandidateMock,
  MOCK_FAIL_MARKER,
  mockStructure,
  overlaySuggestedMock,
  resetSuggestedMock,
  saveMatchCriteriaMock,
} from '@/services/jobs/suggested-candidates.mock';

/**
 * LAB-2847: the TEMPORARY session mock behind `SUGGESTED_ACTIONS_MOCKED`. It
 * exists so the modals have a clickable dev path before the LAB-2846 routes
 * reach the dev API; cutover deletes it with this test.
 */

const person = (memberUid: string, texts: string[]) => ({
  memberUid,
  name: memberUid,
  role: null,
  imageUrl: null,
  fit: 80,
  label: 'Strong match',
  rank: 1,
  blurb: null,
  criteria: texts.map((text) => ({ text, matched: true })),
});

beforeEach(() => resetSuggestedMock());

describe('overlaySuggestedMock', () => {
  it('derives the role’s criteria from the people’s requirement texts when the server sent none', () => {
    const out = overlaySuggestedMock('r1', { suggestions: [person('m1', ['A', 'B']), person('m2', ['B', 'C'])] });

    expect(out.criteria).toEqual([
      { text: 'A', enabled: true, label: 'A', group: 'Other' },
      { text: 'B', enabled: true, label: 'B', group: 'Other' },
      { text: 'C', enabled: true, label: 'C', group: 'Other' },
    ]);
    expect(out.suggestions.map((row) => row.contactedAt)).toEqual([null, null]);
  });

  it('keeps the server’s criteria and switches until the mock saves its own', async () => {
    const response = {
      suggestions: [person('m1', ['A', 'B'])],
      criteria: [
        { text: 'A', enabled: true },
        { text: 'B', enabled: false },
      ],
    };
    expect(overlaySuggestedMock('r1', response).criteria).toEqual([
      { text: 'A', enabled: true, label: 'A', group: 'Other' },
      { text: 'B', enabled: false, label: 'B', group: 'Other' },
    ]);

    await saveMatchCriteriaMock('r1', ['A']);

    expect(overlaySuggestedMock('r1', response).criteria).toEqual([
      { text: 'A', enabled: false, label: 'A', group: 'Other' },
      { text: 'B', enabled: true, label: 'B', group: 'Other' },
    ]);
  });

  /* LAB-2854: labels and groups, so the grouped modal and pane can be clicked through. */
  it('gives the role’s and each person’s criteria the same stand-in label and group', () => {
    const statement = 'Five years of Rust in production systems, shipped end to end';
    const out = overlaySuggestedMock('r1', { suggestions: [person('m1', [statement, 'Based in Europe'])] });

    expect(out.criteria).toEqual([
      { text: statement, enabled: true, label: 'Five years of Rust in production', group: 'Experience' },
      { text: 'Based in Europe', enabled: true, label: 'Based in Europe', group: 'Location' },
    ]);
    expect(out.suggestions[0].criteria).toEqual([
      { text: statement, matched: true, label: 'Five years of Rust in production', group: 'Experience' },
      { text: 'Based in Europe', matched: true, label: 'Based in Europe', group: 'Location' },
    ]);
  });

  it('keeps the server’s own label and group', () => {
    const out = overlaySuggestedMock('r1', {
      suggestions: [person('m1', ['A'])],
      criteria: [{ text: 'A', enabled: true, label: 'Short A', group: 'Skills' }],
    });

    expect(out.criteria).toEqual([{ text: 'A', enabled: true, label: 'Short A', group: 'Skills' }]);
    expect(out.suggestions[0].criteria).toEqual([{ text: 'A', matched: true, label: 'Short A', group: 'Skills' }]);
  });

  it('caps a stand-in label at 40 characters on a word boundary, and falls back to Other', () => {
    const { label, group } = mockStructure('Communicates trade-offs clearly in writing to a distributed audience');

    expect(label).toBe('Communicates trade-offs clearly in');
    expect(label.length).toBeLessThanOrEqual(40);
    expect(group).toBe('Other');
    expect(mockStructure('Senior or above').group).toBe('Seniority');
    expect(mockStructure('Hands-on Rust or Go').group).toBe('Skills');
  });

  it('fills contactedAt for a person the mock contacted', async () => {
    const response = { suggestions: [person('m1', ['A']), person('m2', ['A'])] };
    overlaySuggestedMock('r1', response);

    const sent = await contactSuggestedCandidateMock('r1', 'm1', 'Hi');

    const out = overlaySuggestedMock('r1', response);
    expect(out.suggestions[0].contactedAt).toBe((sent.body as { contactedAt: string }).contactedAt);
    expect(out.suggestions[1].contactedAt).toBeNull();
  });
});

describe('saveMatchCriteriaMock', () => {
  beforeEach(() => {
    overlaySuggestedMock('r1', { suggestions: [person('m1', ['A', 'B'])] });
  });

  it('answers the saved list', async () => {
    await expect(saveMatchCriteriaMock('r1', ['B'])).resolves.toEqual({
      status: 200,
      body: {
        criteria: [
          { text: 'A', enabled: true, label: 'A', group: 'Other' },
          { text: 'B', enabled: false, label: 'B', group: 'Other' },
        ],
        prompt: null,
      },
    });
  });

  /* LAB-2853, the endpoint's rule: absent keeps, null or blank clears. */
  it('saves, keeps and clears the prompt, and the next read carries it', async () => {
    await expect(saveMatchCriteriaMock('r1', [], '  Ran a storage network  ')).resolves.toMatchObject({
      body: { prompt: 'Ran a storage network' },
    });
    expect(overlaySuggestedMock('r1', { suggestions: [person('m1', ['A', 'B'])] }).criteriaPrompt).toBe(
      'Ran a storage network',
    );

    await expect(saveMatchCriteriaMock('r1', ['B'])).resolves.toMatchObject({
      body: { prompt: 'Ran a storage network' },
    });

    await expect(saveMatchCriteriaMock('r1', [], null)).resolves.toMatchObject({ body: { prompt: null } });
    expect(overlaySuggestedMock('r1', { suggestions: [person('m1', ['A', 'B'])] }).criteriaPrompt).toBeNull();
  });

  it('refuses a prompt over 500 characters with a 400', async () => {
    await expect(saveMatchCriteriaMock('r1', [], 'x'.repeat(501))).resolves.toMatchObject({ status: 400 });
  });

  it('refuses an unknown text and all of them off with a 400, as the API does', async () => {
    await expect(saveMatchCriteriaMock('r1', ['Z'])).resolves.toMatchObject({ status: 400 });
    await expect(saveMatchCriteriaMock('r1', ['A', 'B'])).resolves.toMatchObject({ status: 400 });
  });

  it('answers 409 for a role it has no criteria for', async () => {
    await expect(saveMatchCriteriaMock('other', [])).resolves.toMatchObject({ status: 409 });
  });
});

describe('contactSuggestedCandidateMock', () => {
  it('answers 201 with contactedAt, then 409 for the same person and role', async () => {
    const first = await contactSuggestedCandidateMock('r1', 'm1', 'Hi');
    expect(first.status).toBe(201);
    expect(typeof (first.body as { contactedAt: string }).contactedAt).toBe('string');

    await expect(contactSuggestedCandidateMock('r1', 'm1', 'Hi again')).resolves.toMatchObject({ status: 409 });
    await expect(contactSuggestedCandidateMock('r2', 'm1', 'Hi')).resolves.toMatchObject({ status: 201 });
  });

  it('fails with a 500 on the documented marker, and keeps no record', async () => {
    await expect(contactSuggestedCandidateMock('r1', 'm1', `Hi ${MOCK_FAIL_MARKER}`)).resolves.toMatchObject({
      status: 500,
    });
    await expect(contactSuggestedCandidateMock('r1', 'm1', 'Hi')).resolves.toMatchObject({ status: 201 });
  });

  it('refuses an empty or over-long message with a 400', async () => {
    await expect(contactSuggestedCandidateMock('r1', 'm1', '   ')).resolves.toMatchObject({ status: 400 });
    await expect(contactSuggestedCandidateMock('r1', 'm1', 'x'.repeat(2001))).resolves.toMatchObject({ status: 400 });
  });
});
