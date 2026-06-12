import {
  clearFormDraft,
  FORM_DRAFT_TTL_MS,
  readFormDraft,
  writeFormDraft,
} from '@/utils/formDraftStorage';

const KEY = 'form-draft:test';

describe('formDraftStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-12T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('writes and reads a draft envelope', () => {
    writeFormDraft(KEY, { title: 'Need better filters' });
    expect(readFormDraft<{ title: string }>(KEY)).toEqual({ title: 'Need better filters' });
  });

  it('returns null for a missing key', () => {
    expect(readFormDraft(KEY)).toBeNull();
  });

  it('clears corrupt drafts', () => {
    window.localStorage.setItem(KEY, '{not-json');
    expect(readFormDraft(KEY)).toBeNull();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('clears drafts with an invalid envelope shape', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ v: 2, savedAt: Date.now(), data: {} }));
    expect(readFormDraft(KEY)).toBeNull();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('expires drafts past the TTL', () => {
    writeFormDraft(KEY, { title: 'old' });
    jest.setSystemTime(new Date('2026-06-12T12:00:00Z').getTime() + FORM_DRAFT_TTL_MS + 1);
    expect(readFormDraft(KEY)).toBeNull();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('clearFormDraft removes the stored value', () => {
    writeFormDraft(KEY, { title: 'draft' });
    clearFormDraft(KEY);
    expect(readFormDraft(KEY)).toBeNull();
  });
});
