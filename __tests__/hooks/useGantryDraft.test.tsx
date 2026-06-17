import { type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SubmitIdeaDraft } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';

jest.unmock('@tanstack/react-query');

// In-memory IDB simulation
function makeMemoryDB() {
  const store = new Map<string, unknown>();
  return {
    get: jest.fn((_s: string, key: string) => Promise.resolve(store.get(key))),
    put: jest.fn((_s: string, value: unknown, key: string) => { store.set(key, value); return Promise.resolve(); }),
    delete: jest.fn((_s: string, key: string) => { store.delete(key); return Promise.resolve(); }),
    objectStoreNames: { contains: () => true },
    _store: store,
  };
}

let memDB = makeMemoryDB();

jest.mock('idb', () => ({
  openDB: jest.fn(() => Promise.resolve(memDB)),
}));

import {
  useGantryDraftQuery,
  useGantrySaveDraftMutation,
  useGantryDiscardDraftMutation,
} from '@/services/gantry/hooks/useGantryDraft';

const sampleDraft: SubmitIdeaDraft = {
  form: { title: 'Test title', description: '', tags: [], type: null, objective: null },
  showCreateObjective: false,
  newObjectiveTitle: '',
};

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return { client, wrapper: ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )};
}

beforeEach(() => {
  memDB = makeMemoryDB();
  const { openDB } = require('idb');
  (openDB as jest.Mock).mockResolvedValue(memDB);
});

describe('useGantryDraftQuery', () => {
  it('returns null when no draft is stored', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useGantryDraftQuery('idea'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe('useGantrySaveDraftMutation', () => {
  it('writes draft and resolves successfully', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useGantrySaveDraftMutation('idea'), { wrapper });
    await act(async () => { result.current.mutate(sampleDraft); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(memDB.put).toHaveBeenCalled();
  });
});

describe('useGantryDiscardDraftMutation', () => {
  it('deletes the draft and resolves successfully', async () => {
    const envelope = { v: 1, savedAt: Date.now(), data: sampleDraft };
    memDB._store.set('idea', envelope);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useGantryDiscardDraftMutation('idea'), { wrapper });
    await act(async () => { result.current.mutate(); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(memDB._store.has('idea')).toBe(false);
  });
});

describe('save then discard flow', () => {
  it('draft is null after save + discard', async () => {
    const { wrapper, client } = makeWrapper();

    const { result: saveResult } = renderHook(() => useGantrySaveDraftMutation('idea'), { wrapper });
    await act(async () => { saveResult.current.mutate(sampleDraft); });
    await waitFor(() => expect(saveResult.current.isSuccess).toBe(true));

    const { result: discardResult } = renderHook(() => useGantryDiscardDraftMutation('idea'), { wrapper });
    await act(async () => { discardResult.current.mutate(); });
    await waitFor(() => expect(discardResult.current.isSuccess).toBe(true));

    await act(async () => { await client.invalidateQueries(); });

    const { result: queryResult } = renderHook(() => useGantryDraftQuery('idea'), { wrapper });
    await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));
    expect(queryResult.current.data).toBeNull();
  });
});
