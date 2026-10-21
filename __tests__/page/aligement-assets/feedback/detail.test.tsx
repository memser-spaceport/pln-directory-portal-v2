import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import ItemDetail from '@/components/page/aligement-assets/feedback/item-detail';
import IdeasList from '@/components/page/aligement-assets/feedback/ideas-list';
import { comment, item } from './__fixtures__/feedback.fixtures';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

function renderDetail(props: Partial<React.ComponentProps<typeof ItemDetail>> = {}) {
  const handlers = {
    onVote: jest.fn(),
    onComment: jest.fn(),
    onDeleteComment: jest.fn(),
    onHideComment: jest.fn(),
    onMove: jest.fn(),
    onRetryLinear: jest.fn(),
  };
  render(
    <ItemDetail item={item()} comments={[]} isAdmin={false} {...handlers} {...props} />,
  );
  return handlers;
}

describe('AC-T6.3 voting', () => {
  it('reflects vote state through aria-pressed', () => {
    const { rerender } = render(
      <ItemDetail
        item={item({ has_voted: false, vote_count: 3 })}
        comments={[]}
        isAdmin={false}
        onVote={jest.fn()}
        onComment={jest.fn()}
        onDeleteComment={jest.fn()}
        onHideComment={jest.fn()}
        onMove={jest.fn()}
        onRetryLinear={jest.fn()}
      />,
    );
    const button = screen.getByRole('button', { name: /^Vote for/ });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    rerender(
      <ItemDetail
        item={item({ has_voted: true, vote_count: 4 })}
        comments={[]}
        isAdmin={false}
        onVote={jest.fn()}
        onComment={jest.fn()}
        onDeleteComment={jest.fn()}
        onHideComment={jest.fn()}
        onMove={jest.fn()}
        onRetryLinear={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /^Remove your vote/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it.each(['completed', 'declined', 'duplicate'] as const)('disables voting on a %s item with a reason', (status) => {
    renderDetail({ item: item({ status, duplicate_of: status === 'duplicate' ? { id: 'x', title: 'Other' } : null }) });
    const button = screen.getByRole('button', { name: /vote/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title');
    expect(button.getAttribute('title')).not.toBe('');
  });

  it.each(['under_review', 'todo', 'in_progress'] as const)('allows voting while %s', (status) => {
    const handlers = renderDetail({ item: item({ status }) });
    fireEvent.click(screen.getByRole('button', { name: /vote/i }));
    expect(handlers.onVote).toHaveBeenCalled();
  });
});

describe('AC-T6.4 status timeline', () => {
  it('lists every move with its note', () => {
    renderDetail({
      item: item({
        status_events: [
          { from_status: null, to_status: 'under_review', note: null, created_at: '2026-10-19T10:00:00.000Z' },
          {
            from_status: 'under_review',
            to_status: 'todo',
            note: 'Queued for November',
            created_at: '2026-10-20T10:00:00.000Z',
          },
        ],
      }),
    });

    const timeline = screen.getByLabelText('Status timeline');
    expect(timeline).toHaveTextContent('Submitted');
    expect(timeline).toHaveTextContent('Moved to To Do');
    expect(timeline).toHaveTextContent('Queued for November');
  });

  it('renders no timeline section when there are no events', () => {
    renderDetail();
    expect(screen.queryByLabelText('Status timeline')).not.toBeInTheDocument();
  });
});

describe('AC-T6.5 member display', () => {
  it('shows the author by name on the detail and in the list', () => {
    renderDetail();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('marks a PLAA team comment and not a member one', () => {
    renderDetail({
      comments: [comment({ id: 'c1', is_admin_author: true }), comment({ id: 'c2', is_admin_author: false })],
    });
    expect(screen.getByTestId('fb-comment-c1')).toHaveTextContent('PLAA team');
    expect(screen.getByTestId('fb-comment-c2')).not.toHaveTextContent('PLAA team');
  });
});

describe('AC-T6.6 comments', () => {
  it('posts a comment and clears the composer', () => {
    const handlers = renderDetail();
    fireEvent.change(screen.getByLabelText('Add a comment'), { target: { value: 'Good idea' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    expect(handlers.onComment).toHaveBeenCalledWith('Good idea');
    expect(screen.getByLabelText('Add a comment')).toHaveValue('');
  });

  it('will not post whitespace', () => {
    const handlers = renderDetail();
    fireEvent.change(screen.getByLabelText('Add a comment'), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'Post' })).toBeDisabled();
    expect(handlers.onComment).not.toHaveBeenCalled();
  });

  it('offers delete on the viewer’s own comment only', () => {
    renderDetail({
      currentMemberUid: 'member-b',
      comments: [
        comment({ id: 'mine', author: { member_uid: 'member-b', display_name: 'Grace Hopper' } }),
        comment({ id: 'theirs', author: { member_uid: 'member-z', display_name: 'Someone Else' } }),
      ],
    });
    expect(screen.getByTestId('fb-comment-delete-mine')).toBeInTheDocument();
    expect(screen.queryByTestId('fb-comment-delete-theirs')).not.toBeInTheDocument();
  });

  it('shows the moderator placeholder and no body for a hidden comment', () => {
    renderDetail({ comments: [comment({ id: 'h1', hidden: true, body: null, author: null })] });
    const row = screen.getByTestId('fb-comment-h1');
    expect(row).toHaveTextContent('Comment hidden by a moderator');
    expect(row).not.toHaveTextContent('A fixture comment.');
  });

  it('closes the composer on a duplicate and points elsewhere', () => {
    renderDetail({ item: item({ status: 'duplicate', duplicate_of: { id: 'canon', title: 'The real one' } }) });
    expect(screen.queryByLabelText('Add a comment')).not.toBeInTheDocument();
  });
});

describe('AC-T6.7 screenshots are never shown', () => {
  it('reports the count and renders no image', () => {
    const { container } = render(
      <ItemDetail
        item={item({ screenshot_count: 2 })}
        comments={[]}
        isAdmin={false}
        onVote={jest.fn()}
        onComment={jest.fn()}
        onDeleteComment={jest.fn()}
        onHideComment={jest.fn()}
        onMove={jest.fn()}
        onRetryLinear={jest.fn()}
      />,
    );
    expect(screen.getByText(/2 screenshots sent to the PLAA team/)).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  it('says nothing when there are no screenshots', () => {
    renderDetail();
    expect(screen.queryByText(/sent to the PLAA team/)).not.toBeInTheDocument();
  });
});

describe('AC-T6.8 duplicate banner', () => {
  it('links to the canonical item', () => {
    renderDetail({ item: item({ status: 'duplicate', duplicate_of: { id: 'canon-id', title: 'The real one' } }) });
    const link = screen.getByRole('link', { name: 'The real one' });
    expect(link).toHaveAttribute('href', '/alignment-asset/feedback/canon-id');
  });
});

describe('AC-T7.4 admin controls are not rendered for members', () => {
  it('hides the admin panel and Linear state from a non-admin', () => {
    renderDetail({ item: item({ linear_status: 'failed' }) });
    expect(screen.queryByLabelText('Admin controls')).not.toBeInTheDocument();
    expect(screen.queryByTestId('fb-detail-moveto')).not.toBeInTheDocument();
    expect(screen.queryByText(/Linear:/)).not.toBeInTheDocument();
  });

  it('shows them to an admin', () => {
    renderDetail({ isAdmin: true, item: item({ linear_status: 'failed' }) });
    expect(screen.getByLabelText('Admin controls')).toBeInTheDocument();
    expect(screen.getByTestId('fb-detail-moveto')).toBeInTheDocument();
  });
});

describe('ideas list rows', () => {
  it('links each row to its item and keeps voting off the link', () => {
    const onVote = jest.fn();
    render(<IdeasList items={[item({ id: 'row-1', title: 'Row one' })]} onVote={onVote} emptyMessage="none" />);

    expect(screen.getByRole('link', { name: 'Row one' })).toHaveAttribute(
      'href',
      '/alignment-asset/feedback/row-1',
    );
    fireEvent.click(screen.getByTestId('fb-vote-row-1'));
    expect(onVote).toHaveBeenCalledTimes(1);
  });

  it('AC-T6.1: shows the empty state with its action', () => {
    render(
      <IdeasList
        items={[]}
        onVote={jest.fn()}
        emptyMessage="No ideas yet. Be the first to suggest one."
        emptyAction={<button type="button">Give feedback</button>}
      />,
    );
    expect(screen.getByText('No ideas yet. Be the first to suggest one.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
  });

  it('AC-T7.6: marks a private bug in My submissions', () => {
    render(
      <IdeasList
        items={[item({ id: 'bug-1', type: 'bug', is_public: false })]}
        onVote={jest.fn()}
        emptyMessage="none"
        showPrivateMarker
      />,
    );
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('does not mark items private on the public Ideas list', () => {
    render(<IdeasList items={[item({ is_public: false })]} onVote={jest.fn()} emptyMessage="none" />);
    expect(screen.queryByText('Private')).not.toBeInTheDocument();
  });
});
