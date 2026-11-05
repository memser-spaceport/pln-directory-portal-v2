import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

const trackHuskySourceLinkClicked = jest.fn();
jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => ({ trackHuskySourceLinkClicked }),
}));
const onAiWebSourcesShown = jest.fn();
const onAiWebSourceClicked = jest.fn();
jest.mock('@/analytics/unified-search.analytics', () => ({
  useUnifiedSearchAnalytics: () => ({ onAiWebSourcesShown, onAiWebSourceClicked }),
}));

import { AnswerSources } from '@/components/page/husky/Chat/components/Messages/components/PreviewMessage/components/AnswerSources';
import HuskySourceCard from '@/components/core/husky/husky-source-card';

const mixedRefs = [
  { index: 1, title: 'Saturn Grid', type: 'team', directoryLink: '/teams/saturn' },
  { index: 2, title: 'Saturn Grid - About', type: 'web', externalUrl: 'https://saturn.example/about' },
  { index: 3, title: 'Seed round', type: 'web', externalUrl: 'https://news.example/seed' },
];

beforeEach(() => jest.clearAllMocks());

describe('AI Search page: web sources', () => {
  it('shows a "Directory" group and a "Web" group, each with its own sources', async () => {
    render(<AnswerSources sourceRefs={mixedRefs} />);

    fireEvent.click(screen.getByRole('button', { name: '3 sources' }));
    const popup = await screen.findByRole('dialog');

    const directory = within(popup).getByRole('group', { name: 'Directory' });
    const web = within(popup).getByRole('group', { name: 'Web' });
    expect(
      within(directory)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/teams/saturn']);
    expect(
      within(web)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['https://saturn.example/about', 'https://news.example/seed']);
    expect(within(web).getAllByRole('link')[0]).toHaveAttribute('target', '_blank');
  });

  it('shows no "Web" group for an answer from directory data only, and sends no web event', async () => {
    render(<AnswerSources sourceRefs={[mixedRefs[0]]} trackShown />);

    fireEvent.click(screen.getByRole('button', { name: '1 source' }));
    const popup = await screen.findByRole('dialog');

    expect(within(popup).queryByRole('group', { name: 'Web' })).not.toBeInTheDocument();
    expect(within(popup).getByRole('group', { name: 'Directory' })).toBeInTheDocument();
    expect(onAiWebSourcesShown).not.toHaveBeenCalled();
  });

  it('records once that the answer shows web sources, and records a web source click', async () => {
    const { rerender } = render(<AnswerSources sourceRefs={mixedRefs} trackShown />);
    rerender(<AnswerSources sourceRefs={mixedRefs} trackShown />);

    expect(onAiWebSourcesShown).toHaveBeenCalledTimes(1);
    expect(onAiWebSourcesShown).toHaveBeenCalledWith({ webSources: 2, directorySources: 1 }, 'ai-search-page');

    fireEvent.click(screen.getByRole('button', { name: '3 sources' }));
    const popup = await screen.findByRole('dialog');
    fireEvent.click(within(popup).getByRole('link', { name: /Seed round/ }));
    expect(onAiWebSourceClicked).toHaveBeenCalledWith('https://news.example/seed', 'ai-search-page');
    expect(trackHuskySourceLinkClicked).toHaveBeenCalledWith('https://news.example/seed');

    fireEvent.click(within(popup).getByRole('link', { name: /Team$/ }));
    expect(onAiWebSourceClicked).toHaveBeenCalledTimes(1);
  });
});

describe('AI Search page: restored answers', () => {
  it('sends no web-sources-shown event for an answer that did not stream in this view', () => {
    render(<AnswerSources sourceRefs={mixedRefs} />);

    expect(onAiWebSourcesShown).not.toHaveBeenCalled();
  });

  it('shows plain source URLs of an older answer without group labels', async () => {
    render(<AnswerSources sources={['/teams/saturn', 'https://directory.example/teams/x']} trackShown />);

    fireEvent.click(screen.getByRole('button', { name: '2 sources' }));
    const popup = await screen.findByRole('dialog');

    expect(within(popup).queryByText('Directory')).not.toBeInTheDocument();
    expect(within(popup).queryByText('Web')).not.toBeInTheDocument();
    expect(within(popup).getAllByRole('link')).toHaveLength(2);
    expect(onAiWebSourcesShown).not.toHaveBeenCalled();
  });
});

describe('Header search dialog: web sources', () => {
  it('shows the two labeled groups and records a web source click for the dialog', () => {
    render(<HuskySourceCard sourceRefs={mixedRefs} entryPoint="header-dialog" />);

    const web = screen.getByRole('group', { name: 'Web' });
    expect(screen.getByRole('group', { name: 'Directory' })).toBeInTheDocument();
    fireEvent.click(within(web).getByRole('link', { name: 'Saturn Grid - About' }));

    expect(onAiWebSourceClicked).toHaveBeenCalledWith('https://saturn.example/about', 'header-dialog');
  });

  it('shows only the "Directory" group for directory sources', () => {
    render(<HuskySourceCard sourceRefs={[mixedRefs[0]]} entryPoint="header-dialog" />);

    expect(screen.queryByRole('group', { name: 'Web' })).not.toBeInTheDocument();
  });

  it('sends no web event where the card has no entry point (old Husky chat)', () => {
    render(<HuskySourceCard sources={['https://news.example/seed']} />);

    fireEvent.click(screen.getByRole('link', { name: 'https://news.example/seed' }));
    expect(onAiWebSourceClicked).not.toHaveBeenCalled();
  });
});
