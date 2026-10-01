import { act, renderHook } from '@testing-library/react';
import { useCommentDrafts, type CommentDraft } from '@/components/page/ai-apps/components/element-pins';

/*
 * Two renderHook instances stand in for the same app open in two tabs: they share
 * jsdom's localStorage, and a real browser's `storage` event (which only reaches
 * the *other* tabs) is dispatched by hand.
 */

const KEY = 'ai-app-comment-drafts:app-1';

const draft = (note: string, extra: Partial<Omit<CommentDraft, 'id'>> = {}): Omit<CommentDraft, 'id'> =>
  ({
    note,
    element: {
      selector: '#save',
      tag: 'button',
      text: 'Save',
      page: { path: '/pins', viewportW: 1000, viewportH: 700 },
    },
    point: { ox: 0.5, oy: 0.5 },
    env: 'prod',
    cropUrl: 'https://cdn.example/crop.png',
    cropState: 'done',
    annotations: null,
    bridgePinId: null,
    ...(extra as object),
  }) as Omit<CommentDraft, 'id'>;

const otherTabWrote = () => act(() => void window.dispatchEvent(new StorageEvent('storage', { key: KEY })));
const stored = () => JSON.parse(window.localStorage.getItem(KEY) ?? '{"drafts":[],"general":""}');
const tab = () => renderHook(() => useCommentDrafts('app-1'));

beforeEach(() => window.localStorage.clear());

describe('useCommentDrafts across tabs', () => {
  it('sending in one tab keeps the comments queued in another', () => {
    const a = tab();
    const b = tab();
    act(() => void a.result.current.add(draft('from tab A')));
    let sentId = '';
    act(() => {
      sentId = b.result.current.add(draft('from tab B'));
    });
    act(() => b.result.current.remove([sentId]));

    expect(stored().drafts.map((d: CommentDraft) => d.note)).toEqual(['from tab A']);
    otherTabWrote();
    expect(a.result.current.drafts.map((d) => d.note)).toEqual(['from tab A']);
  });

  it('shows a comment queued in another tab without a marker, since that tab owns the pin', () => {
    const a = tab();
    const b = tab();
    act(() => void a.result.current.add(draft('from tab A', { bridgePinId: 'pin-7' })));
    otherTabWrote();

    expect(b.result.current.drafts).toEqual([expect.objectContaining({ note: 'from tab A', bridgePinId: null })]);
    expect(a.result.current.drafts[0].bridgePinId).toBe('pin-7');
  });

  it('Clear drops only the comments this tab was showing', () => {
    const a = tab();
    const b = tab();
    act(() => void a.result.current.add(draft('shown in A')));
    act(() => void b.result.current.add(draft('queued in B since')));
    act(() => a.result.current.clear());

    expect(stored().drafts.map((d: CommentDraft) => d.note)).toEqual(['queued in B since']);
  });

  it('clears the whole-app comment after sending, unless it was rewritten meanwhile', () => {
    const a = tab();
    act(() => a.result.current.setGeneral('first'));
    act(() => a.result.current.setGeneral('rewritten'));
    act(() => a.result.current.clearGeneral('first'));
    expect(a.result.current.general).toBe('rewritten');

    act(() => a.result.current.clearGeneral('rewritten'));
    expect(a.result.current.general).toBe('');
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('a crop another tab is still making reads as failed here; its own tab can still finish it', () => {
    const a = tab();
    const b = tab();
    let id = '';
    act(() => {
      id = a.result.current.add(draft('crop pending', { cropState: 'pending', cropUrl: null }));
    });
    otherTabWrote();
    expect(b.result.current.drafts[0].cropState).toBe('failed');
    expect(a.result.current.drafts[0].cropState).toBe('pending');

    act(() => a.result.current.update(id, { cropState: 'done', cropUrl: 'https://cdn.example/late.png' }));
    otherTabWrote();
    expect(b.result.current.drafts[0]).toEqual(
      expect.objectContaining({ cropState: 'done', cropUrl: 'https://cdn.example/late.png' }),
    );
  });

  it('keeps drafts in memory when the browser won’t store them', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    try {
      const a = tab();
      act(() => void a.result.current.add(draft('one')));
      act(() => void a.result.current.add(draft('two')));
      expect(a.result.current.drafts.map((d) => d.note)).toEqual(['one', 'two']);
    } finally {
      setItem.mockRestore();
    }
  });
});
