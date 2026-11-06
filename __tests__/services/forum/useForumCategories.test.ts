import { renderHook } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { forumFetch } from '@/services/forum/forum.service';
import { useForumCategories } from '@/services/forum/hooks/useForumCategories';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
jest.mock('@/services/forum/forum.service', () => ({ forumFetch: jest.fn() }));

const useQueryMock = useQuery as jest.Mock;
const forumFetchMock = forumFetch as jest.Mock;

/** Runs the hook's queryFn, the way React Query would. */
async function fetchCategories() {
  renderHook(() => useForumCategories());
  const { queryFn } = useQueryMock.mock.calls.at(-1)[0];
  return queryFn();
}

describe('useForumCategories', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    forumFetchMock.mockReset();
  });

  it('decodes category names and descriptions NodeBB sends HTML-escaped (LAB-3141)', async () => {
    forumFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        categories: [
          { cid: 4, name: 'Comments &amp; Feedback', description: 'Got a question? Ask &quot;away&quot;!' },
          { cid: 1, name: 'General', description: 'Plain' },
        ],
      }),
    });

    await expect(fetchCategories()).resolves.toEqual([
      { cid: 4, name: 'Comments & Feedback', description: 'Got a question? Ask "away"!' },
      { cid: 1, name: 'General', description: 'Plain' },
    ]);
    expect(forumFetchMock).toHaveBeenCalledWith('/api/categories');
  });

  it('decodes only once, so an escaped entity stays readable text', async () => {
    forumFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ categories: [{ cid: 9, name: 'Use &amp;amp; in HTML', description: undefined }] }),
    });

    await expect(fetchCategories()).resolves.toEqual([{ cid: 9, name: 'Use &amp; in HTML', description: '' }]);
  });

  it('returns no categories when the forum answers with an error', async () => {
    forumFetchMock.mockResolvedValue({ ok: false });

    await expect(fetchCategories()).resolves.toEqual([]);
  });
});
