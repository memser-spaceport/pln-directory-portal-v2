import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import FeedbackForm from '@/components/page/aligement-assets/feedback/feedback-form';
import ItemDetail from '@/components/page/aligement-assets/feedback/item-detail';
import ItemDetailContainer from '@/components/page/aligement-assets/feedback/item-detail-container';
import { FeedbackApiError, FeedbackStatus } from '@/services/plaa/feedback/feedback.types';
import { item } from './__fixtures__/feedback.fixtures';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: (select: (state: { currentUser: { uid: string } }) => unknown) =>
    select({ currentUser: { uid: 'member-a' } }),
}));
jest.mock('@/analytics/plaa-feedback.analytics', () => ({
  usePlaaFeedbackAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

const mockUpdate = jest.fn();
const mockItem = jest.fn();
jest.mock('@/services/plaa/feedback/useFeedback', () => {
  const idle = () => ({ mutate: jest.fn(), isPending: false });
  return {
    useFeedbackMe: () => ({ data: { is_admin: false, vote_budget: { limit: 5, used: 0, remaining: 5 } } }),
    useFeedbackItem: () => ({ data: mockItem(), isLoading: false, isError: false, refetch: jest.fn() }),
    useFeedbackComments: () => ({ data: { items: [] }, hasMore: false, isLoadingMore: false, loadMore: jest.fn() }),
    useVote: idle,
    useAddComment: idle,
    useDeleteComment: idle,
    useHideComment: idle,
    useChangeStatus: idle,
    useRetryLinear: idle,
    useAdminUpdate: idle,
    useUpdateFeedback: () => ({ mutate: mockUpdate, isPending: false, error: null, reset: jest.fn() }),
  };
});

const AUTHOR = 'member-a';
const mine = (overrides: Parameters<typeof item>[0] = {}) =>
  item({
    author: { member_uid: AUTHOR, display_name: 'Ada Lovelace' },
    title: 'The first title',
    description: 'The description as it was first written.',
    importance: 'Because it matters.',
    link_url: 'https://example.com/first',
    ...overrides,
  });

function renderItem(overrides: Parameters<typeof item>[0], viewer: string | undefined) {
  const onEdit = jest.fn();
  render(
    <ItemDetail
      item={mine(overrides)}
      comments={[]}
      isAdmin={false}
      currentMemberUid={viewer}
      onVote={jest.fn()}
      onComment={jest.fn()}
      onDeleteComment={jest.fn()}
      onHideComment={jest.fn()}
      onMove={jest.fn()}
      onRetryLinear={jest.fn()}
      onAdminUpdate={jest.fn()}
      onEdit={onEdit}
    />,
  );
  return onEdit;
}

const editButton = () => screen.queryByRole('button', { name: 'Edit' });

describe('who may edit an item', () => {
  it('offers Edit to its author while it is under review', () => {
    const onEdit = renderItem({ status: 'under_review' }, AUTHOR);

    fireEvent.click(editButton() as HTMLElement);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it.each<FeedbackStatus>(['todo', 'in_progress', 'completed', 'declined', 'duplicate'])(
    'offers its author no Edit once it is %s',
    (status) => {
      renderItem({ status }, AUTHOR);
      expect(editButton()).not.toBeInTheDocument();
    },
  );

  it('offers no Edit to another member', () => {
    renderItem({ status: 'under_review' }, 'member-b');
    expect(editButton()).not.toBeInTheDocument();
  });

  it('offers no Edit before it knows who is looking', () => {
    renderItem({ status: 'under_review' }, undefined);
    expect(editButton()).not.toBeInTheDocument();
  });
});

function renderEditForm(props: Partial<React.ComponentProps<typeof FeedbackForm>> = {}) {
  const onSubmit = jest.fn();
  const onClose = jest.fn();
  render(<FeedbackForm editing={mine()} onClose={onClose} onSubmit={onSubmit} isSubmitting={false} {...props} />);
  return { onSubmit, onClose };
}

describe('the form when it edits an item', () => {
  it('opens with what the member wrote, focused on the title', () => {
    renderEditForm();

    expect(screen.getByLabelText(/^Title$/)).toHaveValue('The first title');
    expect(screen.getByLabelText(/Describe the new feature/)).toHaveValue('The description as it was first written.');
    expect(screen.getByLabelText(/Why is this important/)).toHaveValue('Because it matters.');
    expect(screen.getByLabelText(/^Link/)).toHaveValue('https://example.com/first');
    expect(screen.getByLabelText(/^Title$/)).toHaveFocus();
  });

  it('does not offer to change the type or add a screenshot, which the API does not accept on an edit', () => {
    renderEditForm();

    expect(screen.queryByRole('group', { name: 'Feedback type' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Screenshot/)).not.toBeInTheDocument();
  });

  it('sends the new text, and leaves out a field the member emptied', () => {
    const { onSubmit } = renderEditForm();

    fireEvent.change(screen.getByLabelText(/^Title$/), { target: { value: 'A better title' } });
    fireEvent.change(screen.getByLabelText(/Why is this important/), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    const sent = onSubmit.mock.calls[0][0];
    expect(sent).toMatchObject({ title: 'A better title', description: 'The description as it was first written.' });
    expect(sent.link_url).toBe('https://example.com/first');
    expect(sent.importance).toBeUndefined();
  });

  it('holds an edit to the same rules as a new submission', () => {
    const { onSubmit } = renderEditForm();

    fireEvent.change(screen.getByLabelText(/^Title$/), { target: { value: 'abc' } });

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('closes without asking when nothing was changed', () => {
    const { onClose } = renderEditForm();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('asks before throwing away a change', () => {
    const { onClose } = renderEditForm();

    fireEvent.change(screen.getByLabelText(/^Title$/), { target: { value: 'A better title' } });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it("gives the API's reason when the item can no longer be edited", () => {
    renderEditForm({ submitError: new FeedbackApiError('This item can no longer be edited', 403) });

    expect(screen.getByRole('alert')).toHaveTextContent('This item can no longer be edited');
  });
});

describe('editing from the item page', () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockItem.mockReturnValue(mine({ id: 'item-7', importance: null, link_url: null }));
  });

  function saveNewTitle() {
    render(<ItemDetailContainer id="item-7" />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText(/^Title$/), { target: { value: 'A better title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  }

  it('saves the edit against that item, and tells the API which optional fields are now empty', () => {
    saveNewTitle();

    expect(mockUpdate.mock.calls[0][0]).toEqual({
      id: 'item-7',
      title: 'A better title',
      description: 'The description as it was first written.',
      importance: null,
      link_url: null,
    });
  });

  it('closes the form once the edit is saved', () => {
    mockUpdate.mockImplementation((_edit: unknown, options: { onSuccess: () => void }) => options.onSuccess());

    saveNewTitle();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the form open, with the new text, when the edit is not saved', () => {
    mockUpdate.mockImplementation(
      (_edit: unknown, options: { onError?: (error: Error) => void; onSettled?: () => void }) => {
        options.onError?.(new Error('upstream down'));
        options.onSettled?.();
      },
    );

    saveNewTitle();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Title$/)).toHaveValue('A better title');
  });
});
