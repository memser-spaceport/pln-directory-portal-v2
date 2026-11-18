import '@testing-library/jest-dom';
import { StrictMode } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DigestPage } from '@/components/page/digest/DigestPage';
import { DigestErrorState } from '@/components/page/digest/DigestErrorState';
import { useCurrentUserStore } from '@/services/auth/store';
import type { DigestPageData, DigestStory } from '@/services/digest/digest.types';

/** LAB-3264: the digest reading page; LAB-3287: page v2. */
let searchParams = new URLSearchParams();
const routerPush = jest.fn();
jest.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
  useRouter: () => ({ replace: jest.fn(), push: routerPush }),
  usePathname: () => '/digest',
}));

const followMutate = jest.fn();
jest.mock('@/services/follow/hooks/useFollowTeam', () => ({
  useFollowTeam: () => ({ mutate: followMutate }),
}));

const capture = jest.fn();
jest.mock('posthog-js/react', () => ({ usePostHog: () => ({ capture }) }));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }),
}));
const { toast } = jest.requireMock('@/components/core/ToastContainer');

const saveDigestChoice = jest.fn();
jest.mock('@/services/digest/digest.service', () => ({
  saveDigestChoice: (...args: unknown[]) => saveDigestChoice(...args),
}));

let mockPrefs: { newsTags: string[] } | undefined;
jest.mock('@/services/members/hooks/useGetMemberPreferences', () => ({
  useGetMemberPreferences: (uid: string | undefined) => ({ data: uid ? mockPrefs : undefined }),
}));
const setNewsTags = jest.fn();
jest.mock('@/services/members/hooks/useSetNewsTags', () => ({ useSetNewsTags: () => setNewsTags }));
jest.mock('@/services/team-news/hooks/useNewsTags', () => ({
  useNewsTags: () => ({
    data: [
      { slug: 'ai', title: 'AI', children: [] },
      { slug: 'defi', title: 'DeFi', children: [] },
      { slug: 'desci', title: 'DeSci', children: [] },
    ],
    isPending: false,
    isError: false,
  }),
}));

let mockDrawerFlag = false;
jest.mock('@/utils/event-drawer', () => ({
  get SHOW_EVENT_DRAWER() {
    return mockDrawerFlag;
  },
}));
let mockMyEventUids: string[] = [];
jest.mock('@/services/events/hooks/useMyUpcomingEventUids', () => ({
  useMyUpcomingEventUids: (enabled: boolean) => ({ data: enabled ? mockMyEventUids : undefined }),
}));
jest.mock('@/services/events/hooks/useEventDrawerQueries', () => ({ usePrefetchEventDetail: () => jest.fn() }));
jest.mock('@/components/page/events/EventDrawer/EventDrawer', () => ({
  EventDrawer: ({ eventUid, source }: { eventUid: string | null; source: string }) =>
    eventUid ? <div data-testid="event-drawer">{`${eventUid} from ${source}`}</div> : null,
}));

const TOKEN = 'v1.secret-token-body.sig';

const story = (uid: string, extra: Partial<DigestStory> = {}): DigestStory => ({
  uid,
  position: 0,
  isTopStory: false,
  title: `Story ${uid}`,
  summary: `Summary ${uid}`,
  contentHtml: `<p>Body ${uid}</p>`,
  image: null,
  imageUrl: null,
  sourceUrl: `https://news.example/${uid}`,
  sourceDomain: 'news.example',
  teamUid: 't',
  teamName: 'Team',
  teamLogoUrl: null,
  followsTeam: false,
  sources: [{ url: `https://news.example/${uid}`, domain: 'news.example' }],
  commentCount: 0,
  eventType: 'LAUNCH',
  tags: ['ai'],
  choice: null,
  ...extra,
});

const data = (extra: Partial<DigestPageData> = {}): DigestPageData => ({
  frequency: 'daily',
  sentAt: '2026-11-16T09:00:00.000Z',
  firstName: 'Ada',
  stories: [story('b', { position: 0, isTopStory: true }), story('a', { position: 1, choice: 'more' })],
  forumPosts: [
    {
      tid: 7,
      title: 'Forum topic',
      authorName: 'Sam',
      authorRole: 'Developer',
      authorTeam: 'Aave',
      authorAvatarUrl: null,
      contentHtml: '<p>Post body</p>',
      url: 'https://web/forum/topics/1/7',
    },
  ],
  forumUnavailable: false,
  isTeamMember: false,
  nextSendAt: '2026-11-18T11:00:00.000Z',
  topics: {
    followed: [{ slug: 'ai', title: 'AI' }],
    suggested: [
      { slug: 'defi', title: 'DeFi' },
      { slug: 'desci', title: 'DeSci' },
    ],
  },
  issues: [{ sentAt: '2026-11-16T09:00:00.000Z', frequency: 'daily', title: 'Story b', isLinkIssue: true }],
  networkNews: [],
  events: { items: [], total: 0 },
  ...extra,
});

const open = (url: string, page = data(), strict = false, issue?: string) => {
  window.history.replaceState(null, '', url);
  searchParams = new URLSearchParams(window.location.search);
  const ui = <DigestPage token={TOKEN} issue={issue} data={page} isLoggedIn={false} />;
  return render(strict ? <StrictMode>{ui}</StrictMode> : ui);
};

const card = (uid: string) => document.getElementById(`story-${uid}`) as HTMLElement;
const flush = () => act(async () => {});

beforeEach(() => {
  jest.clearAllMocks();
  mockPrefs = undefined;
  Element.prototype.scrollIntoView = jest.fn();
  saveDigestChoice.mockImplementation(async (_t, newsItemUid, choice) => ({
    newsItemUid,
    choice: choice === 'none' ? null : choice,
    changed: true,
  }));
});

describe('DigestPage', () => {
  it('shows the header, the stories in order with the top story badge, and the forum posts', () => {
    open('/digest?t=x');
    expect(screen.getByText('Daily digest · 16 November 2026 · 2 stories')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hi Ada,');
    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map((h) => h.textContent)
        .filter((t) => t !== 'How personalization works' && t !== 'Add topics'),
    ).toEqual(['Story b', 'Story a', 'Recent forum posts']);
    expect(within(card('b')).getByText('🔥 Top story')).toBeInTheDocument();
    expect(within(card('a')).queryByText('🔥 Top story')).toBeNull();
    expect(within(card('b')).getByText('Body b')).toBeInTheDocument();
    // Page v2: no "Read on", every source on the Sources line instead.
    expect(screen.queryByRole('link', { name: /^Read on/ })).toBeNull();
    expect(within(card('b')).getByText(/^Source:/)).toBeInTheDocument();
    expect(within(card('b')).getByRole('link', { name: 'news.example' })).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('· Developer @Aave')).toBeInTheDocument();
  });

  describe('page v2 (LAB-3287)', () => {
    beforeEach(() => useCurrentUserStore.setState({ currentUser: null, isHydrated: true }));
    afterEach(() => useCurrentUserStore.setState({ currentUser: null, isHydrated: false }));

    it('shows the team header, every source, the end of the issue and the side card', () => {
      open(
        '/digest?t=x',
        data({
          stories: [
            story('b', {
              isTopStory: true,
              teamUid: 'team-1',
              teamName: 'Lattice',
              teamLogoUrl: 'https://img/lattice.png',
              sources: [
                { url: 'https://news.example/b', domain: 'news.example' },
                { url: 'https://press.example/b', domain: 'press.example' },
              ],
            }),
          ],
        }),
      );
      expect(within(card('b')).getByRole('link', { name: 'Lattice' })).toHaveAttribute('href', '/teams/team-1');
      expect(within(card('b')).getByText(/^Sources:/)).toBeInTheDocument();
      expect(within(card('b')).getByRole('link', { name: 'press.example' })).toHaveAttribute(
        'href',
        'https://press.example/b',
      );
      expect(screen.getByText('You’re all caught up')).toBeInTheDocument();
      expect(screen.getByText('The next digest arrives on Wednesday, 18 November.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'See all network news' })).toHaveAttribute('href', '/');
      expect(screen.getAllByText('How personalization works')).toHaveLength(2);
    });

    it('shows "Got news from your team?" only to team members', () => {
      const { unmount } = open('/digest?t=x');
      expect(screen.queryByText('Got news from your team?')).toBeNull();
      unmount();
      open('/digest?t=x', data({ isTeamMember: true }));
      expect(screen.getByText('Got news from your team?')).toBeInTheDocument();
    });

    it('sends a signed-out reader to sign-in from Follow and Post your team news, and saves nothing', async () => {
      open('/digest?t=x', data({ isTeamMember: true }));
      await userEvent.click(within(card('b')).getByRole('button', { name: /follow/i }));
      await userEvent.click(screen.getByRole('button', { name: 'Post your team news →' }));
      expect(routerPush).toHaveBeenCalledTimes(2);
      expect(routerPush).toHaveBeenLastCalledWith('/digest?t=x#login', { scroll: false });
      expect(followMutate).not.toHaveBeenCalled();
    });

    it('follows for a signed-in reader, and both stories of the team agree', async () => {
      useCurrentUserStore.setState({ currentUser: { uid: 'me' }, isHydrated: true });
      open(
        '/digest?t=x',
        data({
          stories: [
            story('b', { teamUid: 'team-1', teamName: 'Lattice' }),
            story('a', { teamUid: 'team-1', teamName: 'Lattice' }),
          ],
        }),
      );
      await userEvent.click(within(card('b')).getByRole('button', { name: /follow/i }));
      expect(followMutate).toHaveBeenCalledWith({ teamUid: 'team-1', action: 'follow' }, expect.anything());
      expect(routerPush).not.toHaveBeenCalled();
      const labels = ['b', 'a'].map((uid) => within(card(uid)).getByRole('button', { name: /follow/i }).textContent);
      expect(labels[0]).toBe(labels[1]);
      expect(labels[0]).toMatch(/following/i);
    });
  });

  it('shows the saved choice as pressed, with no confirmation', () => {
    open('/digest?t=x');
    expect(within(card('a')).getByRole('button', { name: 'More like this' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('gives forum posts no More / Less buttons', () => {
    open('/digest?t=x');
    const post = document.getElementById('post-7') as HTMLElement;
    expect(within(post).queryByRole('button')).toBeNull();
    expect(within(post).getByRole('link', { name: 'Reply in the forum' })).toHaveAttribute(
      'href',
      'https://web/forum/topics/1/7',
    );
  });

  it('hides the forum section when the forum did not answer', () => {
    open('/digest?t=x', data({ forumPosts: [], forumUnavailable: true }));
    expect(screen.queryByText('Recent forum posts')).toBeNull();
    expect(card('b')).toBeInTheDocument();
  });

  it('scrolls to a #story- hash and marks nothing', () => {
    open('/digest?t=x&link_type=read_more#story-a');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    expect((Element.prototype.scrollIntoView as jest.Mock).mock.contexts[0]).toBe(card('a'));
    expect(saveDigestChoice).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('stays at the top for a hash that names nothing on the page', () => {
    open('/digest?t=x#story-unknown');
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  describe('choice from the email', () => {
    it('saves Less once under Strict Mode, confirms at the top of the card, and drops it from the address', async () => {
      open('/digest?t=x&link_type=less&position=1&story=b&choice=less#story-b', data(), true);
      expect(within(card('b')).getByRole('button', { name: 'Less like this' })).toHaveAttribute('aria-pressed', 'true');
      await flush();

      expect(saveDigestChoice).toHaveBeenCalledTimes(1);
      expect(saveDigestChoice).toHaveBeenCalledWith(TOKEN, 'b', 'less', undefined);
      const receipt = within(card('b')).getByRole('status');
      expect(receipt).toHaveTextContent('You’ll get fewer stories like this');
      // At the top of the card: before the title.
      expect(receipt.compareDocumentPosition(within(card('b')).getByText('Story b'))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(window.location.search).toBe('?t=x&link_type=less&position=1');
      expect(window.location.hash).toBe('#story-b');
    });

    it('rolls back, shows an error toast and keeps the address when the save fails', async () => {
      saveDigestChoice.mockRejectedValueOnce(new Error('down'));
      open('/digest?t=x&story=b&choice=more');
      await flush();
      expect(within(card('b')).getByRole('button', { name: 'More like this' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      expect(screen.queryByRole('status')).toBeNull();
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(window.location.search).toContain('choice=more');
    });

    it('ignores a story that is not on the page', async () => {
      open('/digest?t=x&story=zzz&choice=more');
      await flush();
      expect(saveDigestChoice).not.toHaveBeenCalled();
    });
  });

  describe('presses on the page', () => {
    it('More confirms under the buttons', async () => {
      open('/digest?t=x');
      await userEvent.click(within(card('b')).getByRole('button', { name: 'More like this' }));
      await flush();
      expect(saveDigestChoice).toHaveBeenCalledWith(TOKEN, 'b', 'more', undefined);
      const receipt = within(card('b')).getByRole('status');
      expect(receipt).toHaveTextContent('You’ll get more stories like this');
      expect(within(card('b')).getByRole('button', { name: 'More like this' }).compareDocumentPosition(receipt)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it('a second press on the active button undoes it with the toast', async () => {
      open('/digest?t=x');
      await userEvent.click(within(card('a')).getByRole('button', { name: 'More like this' }));
      await flush();
      expect(saveDigestChoice).toHaveBeenCalledWith(TOKEN, 'a', 'none', undefined);
      expect(within(card('a')).getByRole('button', { name: 'More like this' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      expect(toast.success).toHaveBeenCalledWith('Undone. Your preferences haven’t changed.');
    });

    it('Undo in the confirmation undoes the choice', async () => {
      open('/digest?t=x');
      await userEvent.click(within(card('b')).getByRole('button', { name: 'Less like this' }));
      await flush();
      await userEvent.click(within(card('b')).getByRole('button', { name: 'Undo' }));
      await flush();
      expect(saveDigestChoice).toHaveBeenLastCalledWith(TOKEN, 'b', 'none', undefined);
      expect(within(card('b')).queryByRole('status')).toBeNull();
      expect(toast.success).toHaveBeenCalledTimes(1);
    });

    it('switching More to Less sends less', async () => {
      open('/digest?t=x');
      await userEvent.click(within(card('a')).getByRole('button', { name: 'Less like this' }));
      await flush();
      expect(saveDigestChoice).toHaveBeenCalledWith(TOKEN, 'a', 'less', undefined);
      expect(within(card('a')).getByRole('button', { name: 'Less like this' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('a failed press keeps the last saved state and shows an error toast', async () => {
      saveDigestChoice.mockRejectedValueOnce(new Error('down'));
      open('/digest?t=x');
      await userEvent.click(within(card('a')).getByRole('button', { name: 'Less like this' }));
      await flush();
      expect(within(card('a')).getByRole('button', { name: 'More like this' })).toHaveAttribute('aria-pressed', 'true');
      expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it('applies only the latest of two overlapping presses', async () => {
      const pending: Array<(value: unknown) => void> = [];
      saveDigestChoice.mockImplementation(
        (_t, newsItemUid, choice) =>
          new Promise((resolve) =>
            pending.push(() => resolve({ newsItemUid, choice: choice === 'none' ? null : choice, changed: true })),
          ),
      );
      open('/digest?t=x');
      await userEvent.click(within(card('b')).getByRole('button', { name: 'More like this' }));
      await userEvent.click(within(card('b')).getByRole('button', { name: 'Less like this' }));
      await act(async () => pending[1](null));
      await act(async () => pending[0](null));
      expect(within(card('b')).getByRole('button', { name: 'Less like this' })).toHaveAttribute('aria-pressed', 'true');
      expect(within(card('b')).getByRole('status')).toHaveTextContent('fewer');
    });
  });

  describe('events', () => {
    const events = () => capture.mock.calls.map(([name, props]) => [name, props]);

    it('records the email click and the page view, with no token anywhere', async () => {
      open('/digest?t=x&utm_source=digest_email_more_link&link_type=more&position=2&story=b&choice=more#story-b');
      await flush();
      await userEvent.click(within(card('b')).getByRole('link', { name: 'news.example' }));

      expect(events()).toEqual([
        [
          'forum-digest-email-news-clicked',
          expect.objectContaining({
            utmSource: 'digest_email_more_link',
            link_type: 'more',
            position: '2',
            news_id: 'b',
          }),
        ],
        [
          'digest-page-viewed',
          expect.objectContaining({
            frequency: 'daily',
            sent_at: '2026-11-16T09:00:00.000Z',
            from: 'email-more',
            is_logged_in: false,
          }),
        ],
        ['digest-story-read', expect.objectContaining({ news_id: 'b', position: 0 })],
      ]);
      expect(JSON.stringify(capture.mock.calls)).not.toContain('secret-token-body');
      expect(JSON.stringify(capture.mock.calls)).not.toContain('t=x');
    });

    it('records a post link on the post event', async () => {
      open('/digest?t=x&utm_source=digest_email_post_link&link_type=post&position=1#post-7');
      expect(events()[0]).toEqual([
        'forum-digest-email-post-clicked',
        expect.objectContaining({ link_type: 'post', topic_id: '7' }),
      ]);
      expect(events()[1][1]).toMatchObject({ from: 'email-post' });
    });

    it.each([
      ['post_news', 'postnews=open', 'email-post-news'],
      ['change_topics', 'topics=open', 'email-change-topics'],
    ])("records the email's %s link (LAB-3290)", (linkType, open_, from) => {
      open(`/digest?t=x&utm_source=digest_email_${linkType}_link&link_type=${linkType}&position=0&${open_}`);
      expect(events()[0]).toEqual([
        'forum-digest-email-news-clicked',
        expect.objectContaining({ link_type: linkType, utmSource: `digest_email_${linkType}_link` }),
      ]);
      expect(events()[1][1]).toMatchObject({ from });
    });

    it('records presses and undo with their properties', async () => {
      open('/digest?t=x');
      await userEvent.click(within(card('b')).getByRole('button', { name: 'Less like this' }));
      await flush();
      await userEvent.click(within(card('b')).getByRole('button', { name: 'Undo' }));
      await userEvent.click(within(card('a')).getByRole('button', { name: 'More like this' }));

      expect(events().slice(1)).toEqual([
        ['digest-less-clicked', expect.objectContaining({ news_id: 'b', position: 0, active_after: true })],
        ['digest-undo-clicked', expect.objectContaining({ news_id: 'b', choice_reverted: 'less', via: 'undo-button' })],
        [
          'digest-undo-clicked',
          expect.objectContaining({ news_id: 'a', choice_reverted: 'more', via: 'second-press' }),
        ],
      ]);
      expect(events()[0][1]).toMatchObject({ from: 'direct' });
    });
  });
});

describe('topics (LAB-3289)', () => {
  // The rail and the inline column both render the card (CSS shows one): act on the first.
  const topicsCard = () => screen.getAllByRole('group', { name: 'Topics to add' })[0];
  const chip = (slug: string) => within(topicsCard()).getByRole('button', { name: `#${slug}` });
  const signIn = () => useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
  const saveSucceeds = () =>
    setNewsTags.mockImplementation((next: string[], options?: { onSuccess?: () => void }) => {
      mockPrefs = { newsTags: next };
      options?.onSuccess?.();
    });
  const saveFails = () =>
    setNewsTags.mockImplementation((_next: string[], options?: { onError?: () => void }) => options?.onError?.());

  afterEach(() => useCurrentUserStore.setState({ currentUser: null, isHydrated: false }));

  it('suggests the topics in page order and saves a ticked chip on top of the saved tags', async () => {
    signIn();
    mockPrefs = { newsTags: ['ai'] };
    saveSucceeds();
    open('/digest?t=x');
    expect(
      within(topicsCard())
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['#defi', '#desci']);
    expect(screen.queryByRole('button', { name: 'Save topics' })).toBeNull();

    await userEvent.click(chip('defi'));
    expect(chip('defi')).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getAllByRole('button', { name: 'Save topics' })[0]);

    expect(setNewsTags).toHaveBeenCalledWith(['ai', 'defi'], expect.anything());
    expect(toast.success).toHaveBeenCalledWith('Topics saved. Your next digest uses them.');
    expect(capture).toHaveBeenCalledWith(
      'digest-topics-saved',
      expect.objectContaining({ surface: 'card', added: 1, removed: 0, total: 2 }),
    );
  });

  it('keeps the picks when the save fails', async () => {
    signIn();
    mockPrefs = { newsTags: ['ai'] };
    saveFails();
    open('/digest?t=x');
    await userEvent.click(chip('desci'));
    await userEvent.click(screen.getAllByRole('button', { name: 'Save topics' })[0]);
    expect(setNewsTags).toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(chip('desci')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('button', { name: 'Save topics' })[0]).toBeEnabled();
  });

  it('sends a signed-out reader to sign-in with what they pressed, and saves nothing', async () => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    open('/digest?t=x');
    await userEvent.click(chip('defi'));
    expect(routerPush).toHaveBeenLastCalledWith('/digest?t=x&topic=defi#login', { scroll: false });
    await userEvent.click(screen.getByRole('button', { name: 'Change topics' }));
    expect(routerPush).toHaveBeenLastCalledWith('/digest?t=x&topics=open#login', { scroll: false });
    expect(capture).toHaveBeenCalledWith('digest-topics-sign-in-prompted', expect.objectContaining({ via: 'chip' }));
    expect(setNewsTags).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('back from sign-in, ticks the chip they pressed and clears it from the address', async () => {
    signIn();
    mockPrefs = { newsTags: ['ai'] };
    open('/digest?t=x&topic=desci');
    await flush();
    expect(chip('desci')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('button', { name: 'Save topics' }).length).toBeGreaterThan(0);
    expect(window.location.search).toBe('?t=x');
  });

  it('opens the modal from the email link, and saves the ticked topics', async () => {
    signIn();
    mockPrefs = { newsTags: ['ai'] };
    saveSucceeds();
    open('/digest?t=x&topics=open');
    await flush();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Your topics · 1' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '#ai' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(dialog).getByRole('button', { name: 'Save topics' })).toBeDisabled();

    await userEvent.click(within(dialog).getByRole('button', { name: '#defi' }));
    expect(within(dialog).getByRole('heading', { name: 'Your topics · 2' })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save topics' }));

    expect(setNewsTags).toHaveBeenCalledWith(['ai', 'defi'], expect.anything());
    expect(capture).toHaveBeenCalledWith('digest-topics-saved', expect.objectContaining({ surface: 'modal' }));
    await flush();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Cancel throws the modal picks away', async () => {
    signIn();
    mockPrefs = { newsTags: ['ai'] };
    open('/digest?t=x');
    await userEvent.click(screen.getByRole('button', { name: 'Change topics' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '#desci' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await flush();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(setNewsTags).not.toHaveBeenCalled();
    expect(capture).toHaveBeenCalledWith(
      'digest-topics-modal-opened',
      expect.objectContaining({ via: 'change-topics' }),
    );
  });

  it('sends a signed-out reader from the email link to sign-in first', async () => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    open('/digest?t=x&topics=open');
    await flush();
    expect(routerPush).toHaveBeenLastCalledWith('/digest?t=x&topics=open#login', { scroll: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('more from the network (LAB-3291)', () => {
  const press = (uid: string, extra: Partial<DigestPageData['networkNews'][number]> = {}) => ({
    uid,
    title: `Press ${uid}`,
    url: `https://outlet.example/${uid}`,
    domain: 'outlet.example',
    image: null,
    imageUrl: `https://img.example/${uid}.png`,
    eventDate: '2026-09-25T00:00:00.000Z',
    teamName: 'Team',
    ...extra,
  });

  it('has no section without network news', () => {
    open('/digest?t=x');
    expect(screen.queryByRole('heading', { name: 'More from the network' })).toBeNull();
  });

  it('lists each item after the stories and before the forum posts, opening the outlet in a new tab', () => {
    open('/digest?t=x', data({ networkNews: [press('x'), press('y', { domain: null, imageUrl: null })] }));
    const section = screen.getByRole('region', { name: 'More from the network' });
    const rows = within(section).getAllByRole('link');
    expect(rows.map((row) => row.textContent)).toEqual(['Press xoutlet.example · 25 Sep', 'Press y25 Sep']);
    expect(rows[0]).toHaveAttribute('href', 'https://outlet.example/x');
    expect(rows[0]).toHaveAttribute('target', '_blank');
    expect(rows[0]).toHaveAttribute('rel', 'noopener noreferrer');
    expect(rows[0].querySelector('img')).toHaveAttribute('src', 'https://img.example/x.png');
    expect(rows[1].querySelector('img')).toBeNull();
    expect(rows[1].querySelector('[aria-hidden] svg')).not.toBeNull();
    const forum = screen.getByRole('heading', { name: 'Recent forum posts' });
    expect(card('a').compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(section.compareDocumentPosition(forum) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('records a row click with its position and outlet', async () => {
    open('/digest?t=x', data({ networkNews: [press('x'), press('y')] }));
    capture.mockClear();
    await userEvent.click(screen.getByRole('link', { name: /Press y/ }));
    expect(capture).toHaveBeenCalledWith('digest-network-news-clicked', {
      news_id: 'y',
      position: 1,
      domain: 'outlet.example',
    });
  });
});

describe('upcoming events (LAB-3292)', () => {
  const event = (uid: string, extra: Partial<DigestPageData['events']['items'][number]> = {}) => ({
    uid,
    name: `Event ${uid}`,
    startDate: '2026-11-20T10:00:00.000Z',
    endDate: '2026-11-20T18:00:00.000Z',
    location: 'Lisbon, Portugal',
    locationUid: 'loc1',
    externalId: null,
    logoUrl: `https://logo.example/${uid}.png`,
    type: 'IN_PERSON',
    goingCount: 12,
    ...extra,
  });
  const twoEvents = {
    items: [
      event('e1'),
      event('e2', {
        name: 'Event e2',
        startDate: '2026-11-30T09:00:00.000Z',
        endDate: '2026-12-02T18:00:00.000Z',
        type: 'VIRTUAL',
        goingCount: null,
        logoUrl: null,
      }),
    ],
    total: 9,
  };
  const section = () => screen.getByRole('region', { name: 'Upcoming events' });

  afterEach(() => {
    mockDrawerFlag = false;
    mockMyEventUids = [];
    useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
  });

  it('has no section without events', () => {
    open('/digest?t=x');
    expect(screen.queryByRole('heading', { name: 'Upcoming events' })).toBeNull();
  });

  it('lists the events after the stories, with the date tile, when and where, going, and See all', () => {
    open('/digest?t=x', data({ events: twoEvents }));
    const rows = within(section()).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      'NOV20Event e1Fri · Lisbon12 going',
      'NOV30Event e2Nov 30–Dec 2 · Online',
    ]);
    expect(rows[0].querySelector('img')).toHaveAttribute('src', 'https://logo.example/e1.png');
    expect(rows[1].querySelector('img')).toBeNull();
    expect(within(section()).getByRole('link', { name: 'See all 9 events' })).toHaveAttribute('href', '/events/all');
    const forum = screen.getByRole('heading', { name: 'Recent forum posts' });
    expect(card('a').compareDocumentPosition(section()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(section().compareDocumentPosition(forum) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('says "See all 1 event" for a single event', () => {
    open('/digest?t=x', data({ events: { items: twoEvents.items.slice(0, 1), total: 1 } }));
    expect(within(section()).getByRole('link', { name: 'See all 1 event' })).toBeInTheDocument();
  });

  it('links a row to the event in the calendar when signed out, even with the drawer on, and records the click', async () => {
    mockDrawerFlag = true;
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    open('/digest?t=x', data({ events: twoEvents }));
    const row = within(section()).getByRole('link', { name: /Event e1/ });
    expect(row).toHaveAttribute('href', '/events/all?embedPath=%2Fembed%2Fcalendar%23event-e1');
    await userEvent.click(row);
    expect(capture).toHaveBeenCalledWith('digest-event-clicked', { event_uid: 'e1', position: 0, opens: 'calendar' });
  });

  it('opens the event drawer when signed in with the drawer on, and marks the events the member goes to', async () => {
    mockDrawerFlag = true;
    mockMyEventUids = ['e2'];
    useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
    open('/digest?t=x', data({ events: twoEvents }));
    expect(within(section()).getByRole('button', { name: /Event e2/ })).toHaveTextContent('You’re going');
    await userEvent.click(within(section()).getByRole('button', { name: /Event e1/ }));
    expect(capture).toHaveBeenCalledWith(
      'digest-event-clicked',
      expect.objectContaining({ event_uid: 'e1', position: 0, opens: 'drawer' }),
    );
    expect(await screen.findByTestId('event-drawer')).toHaveTextContent('e1 from digest');
  });
});

describe('past issues (LAB-3294)', () => {
  const issue = (sentAt: string, title: string | null, isLinkIssue = false) => ({
    sentAt,
    frequency: 'daily' as const,
    title,
    isLinkIssue,
  });
  const three = [
    issue('2026-11-18T09:00:00.000Z', 'Newest lead'),
    issue('2026-11-16T09:00:00.000Z', 'Story b', true),
    issue('2026-11-12T09:00:00.000Z', null),
  ];
  const rail = () => document.getElementById('past-rail');
  const toggle = () => screen.getAllByRole('button', { name: 'Past issues' })[0];

  it('is hidden while the link issue is the only one', () => {
    open('/digest?t=x');
    expect(screen.queryByRole('button', { name: 'Past issues' })).not.toBeInTheDocument();
  });

  it('starts collapsed on the latest issue, then lists every issue with its date, Latest and top story', async () => {
    const latest = data({ sentAt: '2026-11-18T09:00:00.000Z', issues: three });
    open('/digest?t=x', latest, false, '2026-11-18T09:00:00.000Z');
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(rail()).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Past issues' })[1]);
    const rows = within(rail()!).getAllByRole('link');
    expect(rows.map((row) => row.textContent)).toEqual([
      '18 November 2026 · LatestNewest lead',
      '16 November 2026Story b',
      '12 November 2026',
    ]);
    expect(rows[0]).toHaveAttribute('aria-current', 'page');
  });

  it('opens on an older issue, marks it, and links each issue from the same link', () => {
    open('/digest?t=x', data({ issues: three }));
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    const rows = within(rail()!).getAllByRole('link');
    const t = encodeURIComponent(TOKEN);
    expect(rows.map((row) => row.getAttribute('href'))).toEqual([
      `?t=${t}&issue=2026-11-18T09%3A00%3A00.000Z`,
      `?t=${t}`,
      `?t=${t}&issue=2026-11-12T09%3A00%3A00.000Z`,
    ]);
    expect(rows[1]).toHaveAttribute('aria-current', 'page');
    expect(rows[0]).not.toHaveAttribute('aria-current');
  });

  it('sends More on a past issue with that issue', async () => {
    const past = data({ sentAt: '2026-11-12T09:00:00.000Z', issues: three });
    open('/digest?t=x', past, false, '2026-11-12T09:00:00.000Z');
    await userEvent.click(within(card('b')).getByRole('button', { name: 'More like this' }));
    await flush();
    expect(saveDigestChoice).toHaveBeenCalledWith(TOKEN, 'b', 'more', '2026-11-12T09:00:00.000Z');
  });
});

describe('DigestErrorState', () => {
  it('says an expired link has expired, with a link to Home', () => {
    render(<DigestErrorState error="expired" />);
    expect(screen.getByRole('heading')).toHaveTextContent('This digest link has expired');
    expect(screen.getByRole('link', { name: 'Go to Home' })).toHaveAttribute('href', '/');
  });

  it('says it could not open any other bad link', () => {
    render(<DigestErrorState error="invalid" />);
    expect(screen.getByRole('heading')).toHaveTextContent('We couldn’t open this digest');
  });
});
