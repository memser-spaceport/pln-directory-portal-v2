import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const onFullSearch = jest.fn();
const onEmailQuerySubmitted = jest.fn();
const useQueryMock = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => useQueryMock(options),
}));
jest.mock('@/analytics/unified-search.analytics', () => ({
  useUnifiedSearchAnalytics: () => ({ onFullSearch, onEmailQuerySubmitted, onSearchResultClick: jest.fn() }),
}));
jest.mock('@/utils/third-party.helper', () => ({
  getCookiesFromClient: () => ({ authToken: 'token-1' }),
}));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

import {
  getFullSearchUrl,
  isEmailQuery,
  useFullApplicationSearch,
} from '@/services/search/hooks/useFullApplicationSearch';
import { SearchResultsItem } from '@/components/core/application-search/components/SearchResultsSection/components/SearchResultsItem';

function runQueryFn(searchTerm: string) {
  function Probe() {
    useFullApplicationSearch(searchTerm);
    return null;
  }
  render(<Probe />);
  const options = useQueryMock.mock.calls[useQueryMock.mock.calls.length - 1][0];
  return options.queryFn();
}

describe('header search by email (LAB-2881)', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DIRECTORY_API_URL = 'https://api.test';
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ members: [], top: [] }) });
    global.fetch = fetchMock as unknown as typeof fetch;
    useQueryMock.mockReturnValue({ data: undefined, isLoading: false });
  });

  it('uses the same email-query rule as the API: an "@" and at least 3 trimmed characters', () => {
    expect(isEmailQuery('juan@protocol.ai')).toBe(true);
    expect(isEmailQuery('@protocol.ai')).toBe(true);
    expect(isEmailQuery(' a@ ')).toBe(false);
    expect(isEmailQuery('juan.perez')).toBe(false);
  });

  it('sends q URL-encoded, so "+" in an address stays a "+"', async () => {
    expect(getFullSearchUrl('juan+test@protocol.ai')).toBe(
      'https://api.test/v1/global-search/all?q=juan%2Btest%40protocol.ai',
    );

    await runQueryFn('juan+test@protocol.ai');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/v1/global-search/all?q=juan%2Btest%40protocol.ai',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends the email-query event once per email-like search, without the search text', async () => {
    await runQueryFn('juan@protocol.ai');

    expect(onEmailQuerySubmitted).toHaveBeenCalledTimes(1);
    expect(onEmailQuerySubmitted).toHaveBeenCalledWith();
  });

  it('does not send the email-query event again when the same search is fetched again (retry, refetch)', async () => {
    await runQueryFn('ana@protocol.ai');
    await runQueryFn('ana@protocol.ai');

    expect(onEmailQuerySubmitted).toHaveBeenCalledTimes(1);

    await runQueryFn('ana@labs.io');
    expect(onEmailQuerySubmitted).toHaveBeenCalledTimes(2);
  });

  it('sends no email-query event for a search that is not email-like', async () => {
    await runQueryFn('juan');

    expect(onEmailQuerySubmitted).not.toHaveBeenCalled();
    expect(onFullSearch).toHaveBeenCalledWith('juan');
  });

  it('shows an email-matched member like any member result: name and profile link, no email', () => {
    const item = { uid: 'm1', name: 'Juan Benet', index: 'members', image: '', matches: [], source: { uid: 'm1' } };
    render(
      <ul>
        <SearchResultsItem item={item as any} />
      </ul>,
    );

    expect(screen.getByText('Juan Benet')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/members/m1');
    expect(document.body.textContent).not.toContain('@');
  });
});
