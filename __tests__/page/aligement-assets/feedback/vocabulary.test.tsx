import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import IdeasList from '@/components/page/aligement-assets/feedback/ideas-list';
import ItemDetail from '@/components/page/aligement-assets/feedback/item-detail';
import RoadmapBoard from '@/components/page/aligement-assets/feedback/roadmap-board';
import TriageList from '@/components/page/aligement-assets/feedback/triage-list';
import { FeedbackStatus } from '@/services/plaa/feedback/feedback.types';
import { comment, item } from './__fixtures__/feedback.fixtures';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const STATUSES: FeedbackStatus[] = ['under_review', 'todo', 'in_progress', 'completed', 'declined', 'duplicate'];
const noop = jest.fn();

describe('PLAA vocabulary', () => {
  it('keeps the banned verb out of everything the board shows or reads aloud, in every status', () => {
    const cards = STATUSES.map((status) => item({ id: `card-${status}`, status, linear_status: 'failed' }));

    const { container } = render(
      <>
        <IdeasList items={[]} onVote={noop} emptyMessage="" />
        <IdeasList items={cards} onVote={noop} emptyMessage="" showPrivateMarker votesRemaining={0} onLoadMore={noop} />
        <RoadmapBoard
          roadmap={{ under_review: [cards[0]], todo: [cards[1]], in_progress: [cards[2]], completed: [cards[3]] }}
          isAdmin
          onVote={noop}
          onMove={noop}
        />
        <TriageList items={cards} onMove={noop} onRetryLinear={noop} />
        {cards.map((card) => (
          <ItemDetail
            key={card.id}
            item={{ ...card, duplicate_of: { id: 'canonical', title: 'Canonical' }, screenshot_count: 2 }}
            comments={[comment(), comment({ id: 'hidden', hidden: true, body: null, author: null })]}
            isAdmin
            onVote={noop}
            onComment={noop}
            onDeleteComment={noop}
            onHideComment={noop}
            onMove={noop}
            onRetryLinear={noop}
          />
        ))}
      </>,
    );

    expect(container.innerHTML).not.toMatch(/\be[a]rn(s|ed|ing)?\b/i);
  });
});
