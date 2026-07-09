import { type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SubmitIdeaDraft } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import type { ApiGantryDraft } from '@/services/gantry/types';

jest.unmock('@tanstack/react-query');

const mockFetchGantryDraftFromApi = jest.fn<Promise<ApiGantryDraft | null>, []>();
const mockSaveGantryDraftToApi = jest.fn<Promise<void>, [unknown]>();
const mockDiscardGantryDraftFromApi = jest.fn<Promise<void>, []>();

jest.mock('@/services/gantry/gantry.service', () => ({
  fetchGantryDraftFromApi: (...args: unknown[]) => mockFetchGantryDraftFromApi(...(args as [])),
  saveGantryDraftToApi: (...args: unknown[]) => mockSaveGantryDraftToApi(...(args as [unknown])),
  discardGantryDraftFromApi: (...args: unknown[]) => mockDiscardGantryDraftFromApi(...(args as [])),
}));

import {
  useGantryDraftQuery,
  useGantrySaveDraftMutation,
  useGantryDiscardDraftMutation,
} from '@/services/gantry/hooks/useGantryDraft';

const UPDATED_AT = '2026-06-17T12:00:00.000Z';

const apiDraft: ApiGantryDraft = {
  uid: 'draft-1',
  variant: 'idea',
  title: 'Test title',
  description: '',
  tags: [],
  type: null,
  stage: null,
  objectiveUids: [],
  newObjectiveTitle: null,
  showCreateObjective: false,
  updatedAt: UPDATED_AT,
};

const sampleDraft: SubmitIdeaDraft = {
  form: { title: 'Test title', description: '', tags: [], type: null, objectives: [] },
  showCreateObjective: false,
  newObjectiveTitle: '',
};

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchGantryDraftFromApi.mockResolvedValue(null);
  mockSaveGantryDraftToApi.mockResolvedValue(undefined);
  mockDiscardGantryDraftFromApi.mockResolvedValue(undefined);
});

describe('useGantryDraftQuery', () => {
  it('returns null when no draft exists', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useGantryDraftQuery('idea'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('returns draft data when API returns a matching draft', async () => {
    mockFetchGantryDraftFromApi.mockResolvedValueOnce(apiDraft);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useGantryDraftQuery('idea'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.data.form.title).toBe('Test title');
    expect(result.current.data!.savedAt).toBe(new Date(UPDATED_AT).getTime());
  });
});

describe('useGantrySaveDraftMutation', () => {
  it('calls saveGantryDraftToApi and resolves successfully', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useGantrySaveDraftMutation('idea'), { wrapper });
    await act(async () => { result.current.mutate(sampleDraft); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSaveGantryDraftToApi).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'idea', title: 'Test title' }),
    );
  });
});

describe('useGantryDiscardDraftMutation', () => {
  it('calls discardGantryDraftFromApi and resolves successfully', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useGantryDiscardDraftMutation('idea'), { wrapper });
    await act(async () => { result.current.mutate(); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDiscardGantryDraftFromApi).toHaveBeenCalled();
  });
});

describe('save then discard flow', () => {
  it('draft is null after discard invalidates the query', async () => {
    // Start with a draft visible, then discard it
    mockFetchGantryDraftFromApi
      .mockResolvedValueOnce(apiDraft)  // initial query fetch → has draft
      .mockResolvedValueOnce(null);      // re-fetch after discard → no draft

    const { wrapper } = makeWrapper();

    // Render query first so it subscribes before mutations fire
    const { result: queryResult } = renderHook(() => useGantryDraftQuery('idea'), { wrapper });
    await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));
    expect(queryResult.current.data).not.toBeNull();

    const { result: discardResult } = renderHook(() => useGantryDiscardDraftMutation('idea'), { wrapper });
    await act(async () => { discardResult.current.mutate(); });
    await waitFor(() => expect(discardResult.current.isSuccess).toBe(true));

    // invalidateQueries triggers a re-fetch of the active query
    await waitFor(() => expect(queryResult.current.data).toBeNull());
  });
});
