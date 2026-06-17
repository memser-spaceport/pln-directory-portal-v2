import type { SubmitIdeaDraft } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';

// In-memory IDB simulation — keeps one store keyed by string.
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
  readGantryDraft,
  writeGantryDraft,
  deleteGantryDraft,
  readGantryDraftSavedAt,
} from '@/utils/gantryDraftStorage';

const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const sampleDraft: SubmitIdeaDraft = {
  form: { title: 'Need better filters', description: '', tags: [], type: null, objective: null },
  showCreateObjective: false,
  newObjectiveTitle: '',
};

beforeEach(() => {
  memDB = makeMemoryDB();
  const { openDB } = require('idb');
  (openDB as jest.Mock).mockResolvedValue(memDB);
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-06-12T12:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('writeGantryDraft + readGantryDraft', () => {
  it('writes and reads back a draft', async () => {
    await writeGantryDraft('idea', sampleDraft);
    const result = await readGantryDraft('idea');
    expect(result).toEqual(sampleDraft);
  });

  it('returns null when no draft is stored', async () => {
    expect(await readGantryDraft('idea')).toBeNull();
  });

  it('stores drafts per variant independently', async () => {
    await writeGantryDraft('idea', sampleDraft);
    expect(await readGantryDraft('roadmap')).toBeNull();
    expect(await readGantryDraft('idea')).toEqual(sampleDraft);
  });
});

describe('expired draft', () => {
  it('returns null and deletes a draft past TTL', async () => {
    await writeGantryDraft('idea', sampleDraft);
    jest.setSystemTime(new Date('2026-06-12T12:00:00Z').getTime() + DRAFT_TTL_MS + 1000);
    expect(await readGantryDraft('idea')).toBeNull();
    expect(memDB.delete).toHaveBeenCalledWith(STORE_NAME_SENTINEL, 'idea');
  });
});

// Sentinel for store name used in assertions
const STORE_NAME_SENTINEL = 'drafts';

describe('deleteGantryDraft', () => {
  it('removes the stored draft', async () => {
    await writeGantryDraft('idea', sampleDraft);
    await deleteGantryDraft('idea');
    expect(await readGantryDraft('idea')).toBeNull();
  });
});

describe('readGantryDraftSavedAt', () => {
  it('returns the savedAt timestamp', async () => {
    await writeGantryDraft('idea', sampleDraft);
    const savedAt = await readGantryDraftSavedAt('idea');
    expect(savedAt).toBe(new Date('2026-06-12T12:00:00Z').getTime());
  });

  it('returns null when no draft exists', async () => {
    expect(await readGantryDraftSavedAt('idea')).toBeNull();
  });
});

describe('IDB unavailable fallback', () => {
  it('writeGantryDraft silently swallows errors', async () => {
    const { openDB } = require('idb');
    (openDB as jest.Mock).mockRejectedValueOnce(new Error('IDB unavailable'));
    await expect(writeGantryDraft('idea', sampleDraft)).resolves.toBeUndefined();
  });

  it('readGantryDraft returns null on error', async () => {
    const { openDB } = require('idb');
    (openDB as jest.Mock).mockRejectedValueOnce(new Error('IDB unavailable'));
    expect(await readGantryDraft('idea')).toBeNull();
  });

  it('deleteGantryDraft silently swallows errors', async () => {
    const { openDB } = require('idb');
    (openDB as jest.Mock).mockRejectedValueOnce(new Error('IDB unavailable'));
    await expect(deleteGantryDraft('idea')).resolves.toBeUndefined();
  });
});
