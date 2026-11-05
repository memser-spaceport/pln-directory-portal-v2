import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CommentItem } from '@/components/page/forum/PostComments/components/CommentItem';
import type { NestedComment } from '@/components/page/forum/PostComments/types';
import type { IUserInfo } from '@/types/shared.types';
import { toast } from '@/components/core/ToastContainer';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/forum/topics/3/3',
  useParams: () => ({}),
}));
jest.mock('react-use', () => ({ useMedia: () => false }));
jest.mock('@/analytics/forum.analytics', () => ({
  useForumAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));
jest.mock('@/components/page/forum/CommentsInputDesktop', () => ({ CommentsInputDesktop: () => null }));
jest.mock('@/components/page/forum/LikesButton', () => ({ LikesButton: () => null }));
jest.mock('@/components/core/OhBadge/OhBadge', () => ({ OhBadge: () => null }));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockDelete = jest.fn();
jest.mock('@/services/forum/hooks/useDeleteComment', () => ({
  useDeleteComment: () => ({ mutateAsync: mockDelete, isPending: false }),
}));

const author = { uid: 'member-1', rbac: { effectivePermissions: [{ code: 'forum.write' }] } } as unknown as IUserInfo;
const admin = {
  uid: 'admin-1',
  rbac: { effectivePermissions: [{ code: 'directory.admin.full' }, { code: 'forum.write' }] },
} as unknown as IUserInfo;

const comment = {
  pid: 14,
  tid: 3,
  content: '<p>My comment</p>',
  timestamp: Date.now(),
  user: { displayname: 'Oleg', memberUid: 'member-1' },
  replies: [],
} as unknown as NestedComment;

async function openMenu() {
  const user = userEvent.setup();
  const trigger = document.querySelector('[data-pid="14"] button') as HTMLElement;
  await user.click(trigger);
  return user;
}

describe('deleting your own forum comment', () => {
  beforeEach(() => {
    mockDelete.mockReset();
    jest.mocked(toast.success).mockReset();
    jest.mocked(toast.error).mockReset();
  });

  it('offers Delete on your own comment and deletes it after you confirm', async () => {
    mockDelete.mockResolvedValue(undefined);
    render(<CommentItem item={comment} userInfo={author} />);

    const user = await openMenu();
    await user.click(await screen.findByText('Delete'));

    expect(screen.getByText('Delete comment?')).toBeInTheDocument();
    expect(mockDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mockDelete).toHaveBeenCalledWith({ tid: 3, pid: 14 });
    await waitFor(() => expect(screen.queryByText('Delete comment?')).not.toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith('Comment deleted');
  });

  it('deletes nothing when you cancel', async () => {
    render(<CommentItem item={comment} userInfo={author} />);

    const user = await openMenu();
    await user.click(await screen.findByText('Delete'));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockDelete).not.toHaveBeenCalled();
    expect(screen.queryByText('Delete comment?')).not.toBeInTheDocument();
  });

  it('keeps the dialog open and says why when the forum refuses', async () => {
    mockDelete.mockRejectedValue(new Error('You do not have enough privileges for this action.'));
    render(<CommentItem item={comment} userInfo={author} />);

    const user = await openMenu();
    await user.click(await screen.findByText('Delete'));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('You do not have enough privileges for this action.'));
    expect(screen.getByText('Delete comment?')).toBeInTheDocument();
  });

  it('gives an admin Edit but not Delete on someone else’s comment', async () => {
    render(<CommentItem item={comment} userInfo={admin} />);

    await openMenu();

    expect(await screen.findByText('Edit')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});
