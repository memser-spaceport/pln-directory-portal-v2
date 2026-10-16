import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * LAB-2847: the Suggested tab's two writes, against a REAL QueryClient — the
 * global jest setup stubs `useMutation` and `useQueryClient`, and a hook test
 * against those stubs would assert nothing about the cache.
 */
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

const mockSave = jest.fn();
const mockContact = jest.fn();
jest.mock('@/services/jobs/team-applicants.service', () => {
  const actual = jest.requireActual('@/services/jobs/team-applicants.service');
  return {
    ...actual,
    saveMatchCriteria: (...args: unknown[]) => mockSave(...args),
    contactSuggestedCandidate: (...args: unknown[]) => mockContact(...args),
  };
});

import {
  suggestedCandidatesQueryKey,
  useContactSuggestedCandidate,
  useSaveMatchCriteria,
} from '@/services/jobs/hooks/useTeamApplicants';
import { TeamApplicantsError, type SuggestedCandidatesResult } from '@/services/jobs/team-applicants.service';
import type { SuggestedCandidate } from '@/schema/suggested-candidates';

const person = (memberUid: string): SuggestedCandidate => ({
  memberUid,
  name: memberUid,
  role: null,
  imageUrl: null,
  fit: 80,
  label: 'Strong match',
  rank: 1,
  blurb: null,
  criteria: [{ text: 'A', matched: true }],
  contactedAt: null,
});

const seeded = (): SuggestedCandidatesResult => ({
  suggestions: [person('m1'), person('m2')],
  criteria: [
    { text: 'A', enabled: true },
    { text: 'B', enabled: true },
  ],
  criteriaPrompt: 'Old words',
});

const KEY = suggestedCandidatesQueryKey('u1', 'r1');
let client: QueryClient;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  mockSave.mockReset();
  mockContact.mockReset();
  client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  client.setQueryData(KEY, seeded());
});

describe('useSaveMatchCriteria', () => {
  it('writes the server’s saved list and prompt into the suggestions cache', async () => {
    const saved = [
      { text: 'A', enabled: true },
      { text: 'B', enabled: false },
    ];
    mockSave.mockResolvedValue({ criteria: saved, prompt: 'New words' });
    const { result } = renderHook(() => useSaveMatchCriteria({ roleUid: 'r1', viewerUid: 'u1' }), { wrapper });

    act(() => result.current.mutate({ disabled: ['B'], prompt: 'New words' }));

    await waitFor(() => expect(client.getQueryData<SuggestedCandidatesResult>(KEY)?.criteria).toEqual(saved));
    expect(client.getQueryData<SuggestedCandidatesResult>(KEY)?.criteriaPrompt).toBe('New words');
    expect(mockSave).toHaveBeenCalledWith('r1', ['B'], 'New words');
    expect(client.getQueryData<SuggestedCandidatesResult>(KEY)?.suggestions).toEqual(seeded().suggestions);
  });

  it('writes a cleared prompt as null', async () => {
    mockSave.mockResolvedValue({ criteria: seeded().criteria, prompt: null });
    const { result } = renderHook(() => useSaveMatchCriteria({ roleUid: 'r1', viewerUid: 'u1' }), { wrapper });

    act(() => result.current.mutate({ disabled: [], prompt: null }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData<SuggestedCandidatesResult>(KEY)?.criteriaPrompt).toBeNull();
    expect(mockSave).toHaveBeenCalledWith('r1', [], null);
  });

  it('leaves the cache alone when the save fails', async () => {
    mockSave.mockRejectedValue(new TeamApplicantsError(500, 'nope'));
    const { result } = renderHook(() => useSaveMatchCriteria({ roleUid: 'r1', viewerUid: 'u1' }), { wrapper });

    act(() => result.current.mutate({ disabled: ['B'], prompt: null }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(KEY)).toEqual(seeded());
  });
});

describe('useContactSuggestedCandidate', () => {
  it('patches that person’s contactedAt from the server’s answer', async () => {
    mockContact.mockResolvedValue({ contactedAt: '2026-10-13T10:00:00.000Z' });
    const { result } = renderHook(() => useContactSuggestedCandidate({ roleUid: 'r1', viewerUid: 'u1' }), {
      wrapper,
    });

    act(() => result.current.mutate({ memberUid: 'm2', message: 'Hi' }));

    await waitFor(() =>
      expect(client.getQueryData<SuggestedCandidatesResult>(KEY)?.suggestions.map((row) => row.contactedAt)).toEqual([
        null,
        '2026-10-13T10:00:00.000Z',
      ]),
    );
    expect(mockContact).toHaveBeenCalledWith('r1', 'm2', 'Hi');
  });

  it('re-reads the suggestions on a 409, without patching from the press', async () => {
    mockContact.mockRejectedValue(new TeamApplicantsError(409, 'Already contacted'));
    const { result } = renderHook(() => useContactSuggestedCandidate({ roleUid: 'r1', viewerUid: 'u1' }), {
      wrapper,
    });

    act(() => result.current.mutate({ memberUid: 'm1', message: 'Hi' }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryState(KEY)?.isInvalidated).toBe(true);
    expect(client.getQueryData(KEY)).toEqual(seeded());
  });

  it('touches nothing on any other failure', async () => {
    mockContact.mockRejectedValue(new TeamApplicantsError(500, 'Send failed'));
    const { result } = renderHook(() => useContactSuggestedCandidate({ roleUid: 'r1', viewerUid: 'u1' }), {
      wrapper,
    });

    act(() => result.current.mutate({ memberUid: 'm1', message: 'Hi' }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryState(KEY)?.isInvalidated).toBe(false);
    expect(client.getQueryData(KEY)).toEqual(seeded());
  });
});
