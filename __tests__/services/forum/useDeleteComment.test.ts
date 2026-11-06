import { deleteForumComment } from '@/services/forum/hooks/useDeleteComment';
import { forumFetch } from '@/services/forum/forum.service';

jest.mock('@/services/forum/forum.service', () => ({ forumFetch: jest.fn() }));

describe('deleteForumComment', () => {
  beforeEach(() => jest.mocked(forumFetch).mockReset());

  it('soft-deletes through the forum proxy, as the member, with no impersonation', async () => {
    jest.mocked(forumFetch).mockResolvedValue({ ok: true } as Response);

    await deleteForumComment({ tid: 3, pid: 14 });

    expect(forumFetch).toHaveBeenCalledWith('/api/v3/posts/14/state', { method: 'DELETE' });
  });

  it('throws NodeBB’s own message when it refuses', async () => {
    jest.mocked(forumFetch).mockResolvedValue({
      ok: false,
      json: async () => ({ status: { message: 'You do not have enough privileges for this action.' } }),
    } as unknown as Response);

    await expect(deleteForumComment({ tid: 3, pid: 14 })).rejects.toThrow(
      'You do not have enough privileges for this action.',
    );
  });

  it('falls back to a plain message when the answer has no body', async () => {
    jest.mocked(forumFetch).mockResolvedValue({
      ok: false,
      json: async () => {
        throw new SyntaxError('Unexpected end of JSON input');
      },
    } as unknown as Response);

    await expect(deleteForumComment({ tid: 3, pid: 14 })).rejects.toThrow('Failed to delete the comment');
  });
});
