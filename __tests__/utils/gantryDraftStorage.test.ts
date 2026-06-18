import type { SubmitIdeaDraft } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import type { ApiGantryDraft } from '@/services/gantry/types';

const mockFetchGantryDraftFromApi = jest.fn<Promise<ApiGantryDraft | null>, []>();
const mockSaveGantryDraftToApi = jest.fn<Promise<void>, [unknown]>();
const mockDiscardGantryDraftFromApi = jest.fn<Promise<void>, []>();

jest.mock('@/services/gantry/gantry.service', () => ({
  fetchGantryDraftFromApi: (...args: unknown[]) => mockFetchGantryDraftFromApi(...(args as [])),
  saveGantryDraftToApi: (...args: unknown[]) => mockSaveGantryDraftToApi(...(args as [unknown])),
  discardGantryDraftFromApi: (...args: unknown[]) => mockDiscardGantryDraftFromApi(...(args as [])),
}));

import {
  readGantryDraft,
  readGantryDraftResult,
  readGantryDraftSavedAt,
  writeGantryDraft,
  deleteGantryDraft,
} from '@/utils/gantryDraftStorage';

const UPDATED_AT = '2026-06-17T12:00:00.000Z';
const UPDATED_AT_MS = new Date(UPDATED_AT).getTime();

const sampleDraft: SubmitIdeaDraft = {
  form: { title: 'Need better filters', description: '', tags: [], type: null, stage: null, objective: null },
  showCreateObjective: false,
  newObjectiveTitle: '',
};

const apiDraft: ApiGantryDraft = {
  uid: 'draft-1',
  variant: 'idea',
  title: 'Need better filters',
  description: '',
  tags: [],
  type: null,
  stage: null,
  objectiveUid: null,
  newObjectiveTitle: null,
  showCreateObjective: false,
  updatedAt: UPDATED_AT,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('readGantryDraftResult', () => {
  it('returns mapped draft and savedAt when variant matches', async () => {
    mockFetchGantryDraftFromApi.mockResolvedValueOnce(apiDraft);
    const result = await readGantryDraftResult('idea');
    expect(result).not.toBeNull();
    expect(result!.savedAt).toBe(UPDATED_AT_MS);
    expect(result!.data.form.title).toBe('Need better filters');
  });

  it('returns null when no draft exists', async () => {
    mockFetchGantryDraftFromApi.mockResolvedValueOnce(null);
    expect(await readGantryDraftResult('idea')).toBeNull();
  });

  it('returns null when stored draft variant does not match requested variant', async () => {
    mockFetchGantryDraftFromApi.mockResolvedValueOnce({ ...apiDraft, variant: 'roadmap' });
    expect(await readGantryDraftResult('idea')).toBeNull();
  });

  it('returns null on API error', async () => {
    mockFetchGantryDraftFromApi.mockRejectedValueOnce(new Error('network error'));
    expect(await readGantryDraftResult('idea')).toBeNull();
  });
});

describe('readGantryDraft', () => {
  it('returns draft data', async () => {
    mockFetchGantryDraftFromApi.mockResolvedValueOnce(apiDraft);
    expect(await readGantryDraft('idea')).toEqual(sampleDraft);
  });

  it('returns null when no draft', async () => {
    mockFetchGantryDraftFromApi.mockResolvedValueOnce(null);
    expect(await readGantryDraft('idea')).toBeNull();
  });
});

describe('readGantryDraftSavedAt', () => {
  it('returns the updatedAt timestamp as ms', async () => {
    mockFetchGantryDraftFromApi.mockResolvedValueOnce(apiDraft);
    expect(await readGantryDraftSavedAt('idea')).toBe(UPDATED_AT_MS);
  });

  it('returns null when no draft exists', async () => {
    mockFetchGantryDraftFromApi.mockResolvedValueOnce(null);
    expect(await readGantryDraftSavedAt('idea')).toBeNull();
  });
});

describe('writeGantryDraft', () => {
  it('calls saveGantryDraftToApi with mapped payload', async () => {
    mockSaveGantryDraftToApi.mockResolvedValueOnce(undefined);
    await writeGantryDraft('idea', sampleDraft);
    expect(mockSaveGantryDraftToApi).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'idea', title: 'Need better filters' }),
    );
  });

  it('silently swallows API errors', async () => {
    mockSaveGantryDraftToApi.mockRejectedValueOnce(new Error('network error'));
    await expect(writeGantryDraft('idea', sampleDraft)).resolves.toBeUndefined();
  });
});

describe('deleteGantryDraft', () => {
  it('calls discardGantryDraftFromApi', async () => {
    mockDiscardGantryDraftFromApi.mockResolvedValueOnce(undefined);
    await deleteGantryDraft('idea');
    expect(mockDiscardGantryDraftFromApi).toHaveBeenCalled();
  });

  it('silently swallows API errors', async () => {
    mockDiscardGantryDraftFromApi.mockRejectedValueOnce(new Error('network error'));
    await expect(deleteGantryDraft('idea')).resolves.toBeUndefined();
  });
});

describe('field mapping — API → SubmitIdeaDraft', () => {
  it('maps tags from string[] to Option[]', async () => {
    mockFetchGantryDraftFromApi.mockResolvedValueOnce({
      ...apiDraft,
      tags: ['infra', 'perf'],
    });
    const result = await readGantryDraft('idea');
    expect(result!.form.tags).toEqual([
      { label: 'infra', value: 'infra' },
      { label: 'perf', value: 'perf' },
    ]);
  });

  it('maps type string to Option', async () => {
    mockFetchGantryDraftFromApi.mockResolvedValueOnce({ ...apiDraft, type: 'Bug Report' });
    const result = await readGantryDraft('idea');
    expect(result!.form.type).toEqual({ label: 'Bug Report', value: 'Bug Report' });
  });

  it('maps stage string to Option with label from GANTRY_STAGE_LABELS', async () => {
    mockFetchGantryDraftFromApi.mockResolvedValueOnce({ ...apiDraft, stage: 'PLANNED' });
    const result = await readGantryDraft('idea');
    expect(result!.form.stage?.value).toBe('PLANNED');
    expect(result!.form.stage?.label).toBe('Planned');
  });

  it('maps objectiveUid to Option with empty label', async () => {
    mockFetchGantryDraftFromApi.mockResolvedValueOnce({ ...apiDraft, objectiveUid: 'obj-123' });
    const result = await readGantryDraft('idea');
    expect(result!.form.objective).toEqual({ label: '', value: 'obj-123' });
  });

  it('maps newObjectiveTitle and showCreateObjective', async () => {
    mockFetchGantryDraftFromApi.mockResolvedValueOnce({
      ...apiDraft,
      newObjectiveTitle: 'Q3 Access',
      showCreateObjective: true,
    });
    const result = await readGantryDraft('idea');
    expect(result!.newObjectiveTitle).toBe('Q3 Access');
    expect(result!.showCreateObjective).toBe(true);
  });
});
