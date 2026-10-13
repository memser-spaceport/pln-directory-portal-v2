import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/analytics/unified-search.analytics', () => ({
  useUnifiedSearchAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

import { SearchResultsItem } from '@/components/core/application-search/components/SearchResultsSection/components/SearchResultsItem';

const item = (index: 'teams' | 'members' | 'projects' | 'events', name: string) =>
  ({ uid: `${index}-1`, name, index, image: undefined, matches: [] }) as any;

describe('Ask AI on a header search result row', () => {
  it('offers Ask AI on team and member rows and hands over the row', () => {
    const onAskAi = jest.fn();
    const onSelect = jest.fn();
    const { unmount } = render(
      <ul>
        <SearchResultsItem item={item('teams', 'Lumen Storage')} onAskAi={onAskAi} onSelect={onSelect} />
      </ul>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ask AI' }));

    expect(onAskAi).toHaveBeenCalledWith(expect.objectContaining({ name: 'Lumen Storage' }));
    expect(onSelect).not.toHaveBeenCalled();
    unmount();

    render(
      <ul>
        <SearchResultsItem item={item('members', 'Jonas Weber')} onAskAi={onAskAi} />
      </ul>,
    );
    expect(screen.getByRole('button', { name: 'Ask AI' })).toBeInTheDocument();
  });

  it('keeps project and event rows, and rows without the action, as plain links', () => {
    const { unmount } = render(
      <ul>
        <SearchResultsItem item={item('projects', 'Filecoin Retrieval Network')} onAskAi={jest.fn()} />
      </ul>,
    );
    expect(screen.queryByRole('button', { name: 'Ask AI' })).not.toBeInTheDocument();
    unmount();

    render(
      <ul>
        <SearchResultsItem item={item('teams', 'Lumen Storage')} />
      </ul>,
    );
    expect(screen.queryByRole('button', { name: 'Ask AI' })).not.toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/teams/teams-1');
  });
});
