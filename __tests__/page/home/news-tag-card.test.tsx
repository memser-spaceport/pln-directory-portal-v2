import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

const analytics = {
  onTeamNewsTagsCardShown: jest.fn(),
  onTeamNewsTagsCardTagToggled: jest.fn(),
  onTeamNewsTagsCardApproved: jest.fn(),
  onTeamNewsTagsCardSaved: jest.fn(),
  onTeamNewsTagsCardSeeAllClicked: jest.fn(),
};
jest.mock('@/analytics/team-news.analytics', () => ({ useTeamNewsAnalytics: () => analytics }));

type MutateOptions = { onSuccess?: () => void; onError?: () => void };
const mockMutate = jest.fn<void, [string[] | undefined, MutateOptions | undefined]>();
let mockIsPending = false;
jest.mock('@/services/team-news/hooks/useNewsDefaultTags', () => ({
  useApproveNewsDefaultTags: () => ({ mutate: mockMutate, isPending: mockIsPending }),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: (...a: unknown[]) => mockToastSuccess(...a), error: (...a: unknown[]) => mockToastError(...a) },
}));

import { NewsTagCard } from '@/components/page/home/TeamNews/components/NewsTagCard/NewsTagCard';
import {
  isTagCardVisible,
  resolveTagCard,
  sourceLine,
  type TagCard,
} from '@/components/page/home/TeamNews/components/NewsTagCard/newsTagCard.utils';
import { ALL_CAT, ALL_TAB, FOR_YOU_CAT } from '@/components/page/home/TeamNews/constants';
import type { INewsDefaultTags } from '@/types/team-news.types';

const tag = (slug: string) => ({ slug, title: slug.toUpperCase() });
const defaultTags = (overrides: Partial<INewsDefaultTags> = {}): INewsDefaultTags => ({
  tags: [tag('ai'), tag('desci')],
  source: 'ai',
  approved: false,
  approvedAt: null,
  generatedAt: null,
  ...overrides,
});
const card = (slugs: string[] = ['ai', 'desci', 'defi'], source: TagCard['source'] = 'ai'): TagCard => ({
  tags: slugs.map(tag),
  source,
});
const chip = (slug: string) => screen.getByRole('button', { name: `#${slug}` });

beforeEach(() => {
  jest.clearAllMocks();
  mockIsPending = false;
});

describe('resolveTagCard', () => {
  it('gives the tags and source of unapproved default tags', () => {
    expect(resolveTagCard(defaultTags())).toEqual({ tags: [tag('ai'), tag('desci')], source: 'ai' });
    expect(resolveTagCard(defaultTags({ source: 'team' }))?.source).toBe('team');
    expect(resolveTagCard(defaultTags({ source: 'interest-profile' }))?.source).toBe('interest-profile');
  });

  it.each([
    ['still loading or failed', undefined],
    ['the member set their own tags', defaultTags({ source: 'member-set', approved: true })],
    ['the member already answered', defaultTags({ approved: true, approvedAt: '2026-11-12T00:00:00.000Z' })],
    ['there is no tag', defaultTags({ tags: [] })],
    ['the data is not default tags', { memberInfo: {} } as unknown as INewsDefaultTags],
  ])('gives no card when %s', (_name, value) => {
    expect(resolveTagCard(value)).toBeNull();
  });
});

describe('isTagCardVisible', () => {
  const resting = {
    preferencesOn: true,
    signedIn: true,
    hasCard: true,
    activeTab: ALL_TAB,
    activeCategory: ALL_CAT,
    query: '',
    hasTopicFilter: false,
  };

  it('is true on All with no filter and on For You', () => {
    expect(isTagCardVisible(resting)).toBe(true);
    expect(isTagCardVisible({ ...resting, activeCategory: FOR_YOU_CAT })).toBe(true);
  });

  it.each([
    ['News preferences is off', { preferencesOn: false }],
    ['the visitor is signed out', { signedIn: false }],
    ['there is no card', { hasCard: false }],
    ['a focus-area tab is on', { activeTab: 'AI & Robotics' }],
    ['another category is on', { activeCategory: 'top' }],
    ['search has text', { query: ' filecoin ' }],
    ['a topic filter is on', { hasTopicFilter: true }],
  ])('is false when %s', (_name, change) => {
    expect(isTagCardVisible({ ...resting, ...change })).toBe(false);
  });
});

describe('sourceLine', () => {
  it('names each source', () => {
    expect(sourceLine('interest-profile')).toBe('Picked from your activity in the network.');
    expect(sourceLine('ai')).toBe('Picked from your profile, teams and projects.');
    expect(sourceLine('team')).toBe("Picked from your teams' focus areas.");
  });
});

describe('NewsTagCard', () => {
  it('shows the title, the source line and every tag turned on', () => {
    render(<NewsTagCard memberUid="user-1" card={card(['ai', 'desci'])} visible />);

    expect(screen.getByRole('heading', { name: 'We picked these topics for you' })).toBeInTheDocument();
    expect(screen.getByText('Picked from your profile, teams and projects.')).toBeInTheDocument();
    expect(chip('ai')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('desci')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Looks good' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'See all topics' })).toBeInTheDocument();
  });

  it('renders nothing without a card or a member', () => {
    const { container, rerender } = render(<NewsTagCard memberUid="user-1" card={null} visible />);
    expect(container).toBeEmptyDOMElement();
    rerender(<NewsTagCard card={card()} visible />);
    expect(container).toBeEmptyDOMElement();
    expect(analytics.onTeamNewsTagsCardShown).not.toHaveBeenCalled();
  });

  it('approves the tags as shown on Looks good, and says so', () => {
    render(<NewsTagCard memberUid="user-1" card={card(['ai', 'desci'])} visible />);

    fireEvent.click(screen.getByRole('button', { name: 'Looks good' }));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate.mock.calls[0][0]).toBeUndefined();
    expect(analytics.onTeamNewsTagsCardApproved).toHaveBeenCalledWith({
      memberUid: 'user-1',
      source: 'ai',
      tags: ['ai', 'desci'],
    });
    mockMutate.mock.calls[0][1]?.onSuccess?.();
    expect(mockToastSuccess).toHaveBeenCalledWith('Topics saved');
  });

  it('turns a chip off and on in place without a request', () => {
    render(<NewsTagCard memberUid="user-1" card={card()} visible />);

    fireEvent.click(chip('defi'));
    expect(chip('defi')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getAllByRole('button', { name: /^#/ }).map((b) => b.textContent)).toEqual(['#ai', '#desci', '#defi']);
    expect(screen.getByRole('button', { name: 'Save topics' })).toBeInTheDocument();

    fireEvent.click(chip('defi'));
    expect(chip('defi')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Looks good' })).toBeInTheDocument();

    expect(mockMutate).not.toHaveBeenCalled();
    expect(analytics.onTeamNewsTagsCardTagToggled).toHaveBeenNthCalledWith(1, {
      memberUid: 'user-1',
      source: 'ai',
      tag: 'defi',
      on: false,
    });
    expect(analytics.onTeamNewsTagsCardTagToggled).toHaveBeenNthCalledWith(2, {
      memberUid: 'user-1',
      source: 'ai',
      tag: 'defi',
      on: true,
    });
  });

  it('saves the chips left on, in the shown order, on Save topics', () => {
    render(<NewsTagCard memberUid="user-1" card={card()} visible />);

    fireEvent.click(chip('ai'));
    fireEvent.click(chip('defi'));
    fireEvent.click(chip('ai'));
    fireEvent.click(screen.getByRole('button', { name: 'Save topics' }));

    expect(mockMutate.mock.calls[0][0]).toEqual(['ai', 'desci']);
    expect(analytics.onTeamNewsTagsCardSaved).toHaveBeenCalledWith({
      memberUid: 'user-1',
      source: 'ai',
      tags: ['ai', 'desci'],
      removedTags: ['defi'],
    });
    expect(analytics.onTeamNewsTagsCardApproved).not.toHaveBeenCalled();
  });

  it('disables Save topics while no chip is on, and keeps See all topics', () => {
    render(<NewsTagCard memberUid="user-1" card={card(['ai'])} visible />);

    fireEvent.click(chip('ai'));

    expect(screen.getByRole('button', { name: 'Save topics' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'See all topics' })).toBeEnabled();
  });

  it('keeps the chips and shows an error when the request fails', () => {
    render(<NewsTagCard memberUid="user-1" card={card(['ai', 'desci'])} visible />);

    fireEvent.click(chip('desci'));
    fireEvent.click(screen.getByRole('button', { name: 'Save topics' }));
    mockMutate.mock.calls[0][1]?.onError?.();

    expect(mockToastError).toHaveBeenCalledWith('Could not save your topics. Please try again.');
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(chip('desci')).toHaveAttribute('aria-pressed', 'false');
    expect(chip('ai')).toHaveAttribute('aria-pressed', 'true');
  });

  it('holds the primary button while a request runs', () => {
    mockIsPending = true;
    render(<NewsTagCard memberUid="user-1" card={card()} visible />);
    expect(screen.getByRole('button', { name: 'Looks good' })).toBeDisabled();
  });

  it('approves and opens News preferences on See all topics', () => {
    render(<NewsTagCard memberUid="user-1" card={card()} visible />);

    fireEvent.click(screen.getByRole('button', { name: 'See all topics' }));

    expect(mockMutate).toHaveBeenCalledWith(undefined);
    expect(mockPush).toHaveBeenCalledWith('/settings/news-preferences?from=feed');
    expect(analytics.onTeamNewsTagsCardSeeAllClicked).toHaveBeenCalledWith({ memberUid: 'user-1', source: 'ai' });
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it('records shown once, and keeps the chips, across a filter on and off', () => {
    const shown = card();
    const { rerender } = render(<NewsTagCard memberUid="user-1" card={shown} visible />);
    fireEvent.click(chip('defi'));

    rerender(<NewsTagCard memberUid="user-1" card={shown} visible={false} />);
    expect(screen.queryByRole('heading', { name: 'We picked these topics for you' })).not.toBeInTheDocument();

    rerender(<NewsTagCard memberUid="user-1" card={shown} visible />);
    expect(chip('defi')).toHaveAttribute('aria-pressed', 'false');
    expect(analytics.onTeamNewsTagsCardShown).toHaveBeenCalledTimes(1);
    expect(analytics.onTeamNewsTagsCardShown).toHaveBeenCalledWith({
      memberUid: 'user-1',
      source: 'ai',
      tags: ['ai', 'desci', 'defi'],
    });
  });

  it('does not record shown while a filter hides it from the start', () => {
    render(<NewsTagCard memberUid="user-1" card={card()} visible={false} />);
    expect(analytics.onTeamNewsTagsCardShown).not.toHaveBeenCalled();
  });
});
