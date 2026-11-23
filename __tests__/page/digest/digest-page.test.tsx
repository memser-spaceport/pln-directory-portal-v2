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

const saveIssueChoice = jest.fn();
jest.mock('@/services/digest/digest.service', () => ({
  saveDigestIssueChoice: (...args: unknown[]) => saveIssueChoice(...args),
}));

// LAB-3313: the signed-in member's record as `getMemberInfo` returns it: `teamMemberRoles`, no `teams` / `mainTeam`.
let mockMember: unknown;
jest.mock('@/services/members/hooks/useMember', () => ({
  useMember: (uid: string | undefined) => ({ data: uid ? mockMember : undefined, isError: false, refetch: jest.fn() }),
}));
const role = (uid: string, name: string, mainTeam = false) => ({
  teamTitle: name,
  teamUid: uid,
  role: 'Engineer',
  team: { uid, name },
  mainTeam,
  teamLead: false,
});
const memberWith = (...roles: ReturnType<typeof role>[]) => ({ memberInfo: { uid: 'me', teamMemberRoles: roles } });
jest.mock('@/services/team-news/hooks/useCreateTeamNewsPost', () => ({
  useCreateTeamNewsPost: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock('@/components/page/team-details/TeamNews/PostNewsModal', () => ({
  PostNewsModal: ({ open, teamName }: { open: boolean; teamName: string }) =>
    open ? <div role="dialog" aria-label="Post news">{`Published as ${teamName}`}</div> : null,
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
const ISSUE = 'iss-1';

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

let mockFeedPosts: unknown[] = [];
let mockFeedLoading = false;
let mockForumAccess = true;
// A disabled query still serves what's cached (a sign-out in the same session), so the mock always answers.
jest.mock('@/components/page/digest/leavePage', () => ({ leavePage: jest.fn() }));
const { leavePage } = jest.requireMock('@/components/page/digest/leavePage');
jest.mock('@/services/feed/hooks/useFeedForumPosts', () => ({
  useFeedForumPosts: () => ({ data: mockFeedLoading ? undefined : { items: mockFeedPosts } }),
}));
jest.mock('@/services/access-control/hooks/useForumAccess', () => ({
  useForumAccess: () => ({ hasAccess: mockForumAccess }),
}));
jest.mock('@/services/feed/hooks/useFeedComments', () => ({ useFeedForumTopicLike: () => undefined }));
// LAB-3347: a story's comments thread, as far as the page is concerned: mounted (open) or not.
jest.mock('@/components/page/home/TeamNews/components/FeedCommentsThread/FeedCommentsThread', () => ({
  FeedCommentsThread: ({ itemUid }: { itemUid: string }) => <div data-testid={`thread-${itemUid}`} />,
  feedThreadDomId: (uid: string) => `feed-thread-${uid}`,
}));
const likeMutate = jest.fn();
jest.mock('@/services/feed/hooks/useFeedForumPostLikeToggle', () => ({
  useFeedForumPostLikeToggle: () => ({ mutate: likeMutate }),
}));
jest.mock('@/components/page/home/TeamNews/components/ForumPostModal/ForumPostModal', () => ({
  ForumPostModal: ({ post, onClose, onLikeToggle }: any) => (
    <div data-testid="forum-modal">
      {`${post.title} · ${post.likeCount} likes · ${post.viewerHasLiked ? 'liked' : 'not liked'}`}
      <button type="button" onClick={() => onLikeToggle(post)}>
        Like
      </button>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

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
      replyCount: 3,
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
  issues: [{ uid: ISSUE, sentAt: '2026-11-16T09:00:00.000Z', frequency: 'daily', title: 'Story b', isLinkIssue: true }],
  networkNews: [],
  events: { items: [], total: 0 },
  ...extra,
});

const open = (url: string, page = data(), strict = false, issueUid = ISSUE) => {
  window.history.replaceState(null, '', url);
  searchParams = new URLSearchParams(window.location.search);
  const ui = <DigestPage key={issueUid} issueUid={issueUid} data={page} isLoggedIn={false} />;
  return render(strict ? <StrictMode>{ui}</StrictMode> : ui);
};

const card = (uid: string) => document.getElementById(`story-${uid}`) as HTMLElement;
const flush = () => act(async () => {});
/** LAB-3347: the sign-in prompt a signed-out press opens, named by its title. */
const signInPrompt = () => screen.getByRole('dialog', { name: /^Sign in to/ });
const answerPrompt = (name: 'Sign in' | 'Sign up' | 'Close') =>
  userEvent.click(within(signInPrompt()).getByRole('button', { name }));

beforeEach(() => {
  jest.clearAllMocks();
  mockPrefs = undefined;
  Element.prototype.scrollIntoView = jest.fn();
  saveIssueChoice.mockImplementation(async (_t, newsItemUid, choice) => ({
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
    ).toEqual(['Story b', 'Story a', 'From the forum']);
    expect(within(card('b')).getByText('🔥 Top story')).toBeInTheDocument();
    expect(within(card('a')).queryByText('🔥 Top story')).toBeNull();
    expect(within(card('b')).getByText('Body b')).toBeInTheDocument();
    // Page v2: no "Read on", every source on the Sources line instead.
    expect(screen.queryByRole('link', { name: /^Read on/ })).toBeNull();
    expect(within(card('b')).getByText(/^Source:/)).toBeInTheDocument();
    expect(within(card('b')).getByRole('link', { name: 'news.example' })).toHaveAttribute('rel', 'noopener noreferrer');
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

    it('ends with the design’s footer: why they got it, Manage preferences and Unsubscribe (LAB-3314)', () => {
      open('/digest?t=x');
      const footer = screen.getByText('The Protocol Labs team').closest('footer') as HTMLElement;
      expect(
        within(footer).getByText('You received this email because you are a member of the Protocol Labs network.'),
      ).toBeInTheDocument();
      // The email settings, behind sign-in (LAB-3351): no token, so a forwarded page can't change the sender's.
      const query = (name: string) => {
        const url = new URL(within(footer).getByRole('link', { name }).getAttribute('href') as string, 'http://x');
        return [
          url.pathname,
          url.searchParams.get('t'),
          url.searchParams.get('link_type'),
          url.searchParams.get('utm_source'),
        ];
      };
      expect(query('Manage preferences')).toEqual(['/settings/email', null, 'manage', 'digest_page_manage_link']);
      expect(query('Unsubscribe')).toEqual(['/settings/email', null, 'unsubscribe', 'digest_page_unsubscribe_link']);
    });

    it('shows "Got news from your team?" only to signed-in team members (LAB-3347)', () => {
      // Signed out the reader's team is unknown, so the card is hidden even when the page data says otherwise.
      const signedOutView = open('/digest?t=x', data({ isTeamMember: true }));
      expect(screen.queryByText('Got news from your team?')).toBeNull();
      signedOutView.unmount();
      useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
      mockMember = memberWith(role('t1', 'Team One'));
      const notMember = open('/digest?t=x');
      expect(screen.queryByText('Got news from your team?')).toBeNull();
      notMember.unmount();
      open('/digest?t=x', data({ isTeamMember: true }));
      expect(screen.getByText('Got news from your team?')).toBeInTheDocument();
    });

    it('asks a signed-out reader to sign in from Follow, and follows nothing before it (LAB-3347)', async () => {
      open('/digest?t=x');
      await userEvent.click(within(card('b')).getByRole('button', { name: /follow/i }));
      expect(signInPrompt()).toHaveAccessibleName('Sign in to follow Team');
      expect(
        within(signInPrompt()).getByText('Their news comes first in your feed and your digest.'),
      ).toBeInTheDocument();
      expect(routerPush).not.toHaveBeenCalled();
      await answerPrompt('Sign in');
      expect(routerPush).toHaveBeenLastCalledWith('/digest?issue=iss-1&follow=t#login', { scroll: false });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(followMutate).not.toHaveBeenCalled();
      expect(capture).toHaveBeenCalledWith('digest-sign-in-prompted', { via: 'follow', team_uid: 't' });
      expect(capture).toHaveBeenCalledWith('digest-sign-in-prompt-answered', { press: 'follow', action: 'sign-in' });
    });

    it('back from a Follow sign-in, follows that team once and clears it from the address (LAB-3347)', async () => {
      useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
      open('/digest?t=x&follow=t', data(), true);
      await flush();
      expect(followMutate).toHaveBeenCalledTimes(1);
      expect(followMutate).toHaveBeenCalledWith({ teamUid: 't', action: 'follow' }, expect.anything());
      expect(within(card('b')).getByRole('button', { name: /following|unfollow/i })).toBeInTheDocument();
      expect(window.location.search).toBe('?issue=iss-1');
    });

    it('back from a Follow sign-in, follows even when the page thinks the team is followed (LAB-3347)', async () => {
      // The page's follow state may predate the sign-in: a toggle there would unfollow the team they asked to follow.
      useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
      const followed = (uid: string) => story(uid, { followsTeam: true });
      open('/digest?issue=iss-1&follow=t', data({ stories: [followed('b'), followed('a')] }));
      await flush();
      expect(followMutate).toHaveBeenCalledWith({ teamUid: 't', action: 'follow' }, expect.anything());
    });

    it('asks a signed-out reader to sign in from Comments, and opens the thread after it (LAB-3347)', async () => {
      const { unmount } = open('/digest?t=x');
      const comments = () => within(card('b')).getByRole('button', { name: /comment/i });
      await userEvent.click(comments());
      expect(signInPrompt()).toHaveAccessibleName('Sign in to read and add comments');
      expect(screen.queryByTestId('thread-b')).toBeNull();
      expect(within(signInPrompt()).getByText('Comments on network stories are open to members.')).toBeInTheDocument();
      expect(comments()).toHaveAttribute('aria-expanded', 'false');
      await answerPrompt('Sign in');
      expect(routerPush).toHaveBeenLastCalledWith('/digest?issue=iss-1&comments=b#login', { scroll: false });
      expect(capture).toHaveBeenCalledWith('digest-sign-in-prompted', { via: 'comments', news_id: 'b' });
      unmount();

      // Sign-in finishes without a reload: the address still names the story, and its thread opens.
      open('/digest?issue=iss-1&comments=b');
      expect(comments()).toHaveAttribute('aria-expanded', 'false');
      act(() => useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true }));
      await flush();
      expect(comments()).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByTestId('thread-b')).toBeInTheDocument();
      expect(screen.queryByTestId('thread-a')).toBeNull();
      expect(card('b').scrollIntoView).toHaveBeenCalled();
      expect(window.location.search).toBe('?issue=iss-1');
    });

    it('sends Sign up to the sign-up flow with the press in returnTo, and Close cancels the press (LAB-3347)', async () => {
      open('/digest?t=x');
      await userEvent.click(within(card('b')).getByRole('button', { name: 'More like this' }));
      await answerPrompt('Sign up');
      expect(routerPush).toHaveBeenLastCalledWith(
        `/sign-up?returnTo=${encodeURIComponent('/digest?issue=iss-1&story=b&choice=more')}`,
      );
      expect(capture).toHaveBeenCalledWith('digest-sign-in-prompt-answered', { press: 'more', action: 'sign-up' });
      routerPush.mockClear();

      await userEvent.click(within(card('b')).getByRole('button', { name: 'Less like this' }));
      await answerPrompt('Close');
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(routerPush).not.toHaveBeenCalled();
      expect(saveIssueChoice).not.toHaveBeenCalled();
      expect(capture).toHaveBeenCalledWith('digest-sign-in-prompt-answered', { press: 'less', action: 'close' });
    });

    it('tells a signed-out reader what they see, with Sign in to personalize (LAB-3347)', async () => {
      useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
      const { unmount } = open('/digest?t=x');
      // The server already knows the reader is signed out, so the right sentence shows before the store hydrates.
      const signedOutLine =
        'You’re seeing the network’s top stories. Signed in, your digest leads with your topics, then the teams you follow.';
      expect(screen.getAllByText(signedOutLine)).toHaveLength(2);
      expect(screen.queryByText(/^Stories come from your topics first/)).toBeNull();
      unmount();

      useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
      open('/digest?t=x');
      await userEvent.click(screen.getAllByRole('button', { name: 'Sign in to personalize' })[0]);
      expect(signInPrompt()).toHaveAccessibleName('Sign in to personalize your digest');
      expect(
        within(signInPrompt()).getByText('Pick topics and follow teams, and your digest leads with them.'),
      ).toBeInTheDocument();
      await answerPrompt('Sign in');
      expect(routerPush).toHaveBeenLastCalledWith('/digest?issue=iss-1#login', { scroll: false });
      expect(capture).toHaveBeenCalledWith('digest-sign-in-prompted', { via: 'personalize' });
    });

    it('keeps the signed-in sentence and no sign-in link for a signed-in reader (LAB-3347)', () => {
      useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
      open('/digest?t=x');
      expect(
        screen.getAllByText(
          'Stories come from your topics first, then the teams you follow, then the network’s top stories.',
        ),
      ).toHaveLength(2);
      expect(screen.queryByRole('button', { name: 'Sign in to personalize' })).toBeNull();
    });

    // LAB-3308: Google and GitHub sign-in come back to the same address, still signed out until Privy finishes.
    // Sending the reader to sign-in again then throws that sign-in away, so they never get signed in.
    const OAUTH_RETURN = 'privy_oauth_state=s&privy_oauth_provider=google&privy_oauth_code=c';

    it("sends a signed-out reader from the email's Post your team news link to sign-in, but not on the way back from Google", async () => {
      const { unmount } = open('/digest?t=x&postnews=open', data({ isTeamMember: true }));
      await flush();
      expect(routerPush).toHaveBeenLastCalledWith('/digest?issue=iss-1&postnews=open#login', { scroll: false });
      unmount();
      routerPush.mockClear();

      open(`/digest?t=x&postnews=open&${OAUTH_RETURN}`, data({ isTeamMember: true }));
      await flush();
      expect(routerPush).not.toHaveBeenCalled();
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

  it('hides the forum section when the forum did not answer', () => {
    open('/digest?t=x', data({ forumPosts: [], forumUnavailable: true }));
    expect(screen.queryByRole('heading', { name: 'From the forum' })).toBeNull();
    expect(card('b')).toBeInTheDocument();
  });

  it('scrolls to a #story- hash and marks nothing', () => {
    open('/digest?t=x&link_type=read_more#story-a');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    expect((Element.prototype.scrollIntoView as jest.Mock).mock.contexts[0]).toBe(card('a'));
    expect(saveIssueChoice).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('stays at the top for a hash that names nothing on the page', () => {
    open('/digest?t=x#story-unknown');
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  describe('choice from the email', () => {
    beforeEach(() => useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true }));
    afterEach(() => useCurrentUserStore.setState({ currentUser: null, isHydrated: false }));

    it('saves Less once under Strict Mode, confirms at the top of the card, and drops it from the address', async () => {
      open('/digest?t=x&link_type=less&position=1&story=b&choice=less#story-b', data(), true);
      expect(within(card('b')).getByRole('button', { name: 'Less like this' })).toHaveAttribute('aria-pressed', 'true');
      await flush();

      expect(saveIssueChoice).toHaveBeenCalledTimes(1);
      expect(saveIssueChoice).toHaveBeenCalledWith(ISSUE, 'b', 'less');
      const receipt = within(card('b')).getByRole('status');
      expect(receipt).toHaveTextContent('You’ll get fewer stories like this');
      // At the top of the card: before the title.
      expect(receipt.compareDocumentPosition(within(card('b')).getByText('Story b'))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(window.location.search).toBe('?issue=iss-1&link_type=less&position=1');
      expect(window.location.hash).toBe('#story-b');
    });

    it('rolls back, shows an error toast and keeps the address when the save fails', async () => {
      saveIssueChoice.mockRejectedValueOnce(new Error('down'));
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
      expect(saveIssueChoice).not.toHaveBeenCalled();
    });
  });

  describe('presses on the page', () => {
    beforeEach(() => useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true }));
    afterEach(() => useCurrentUserStore.setState({ currentUser: null, isHydrated: false }));

    it('More confirms under the buttons', async () => {
      open('/digest?t=x');
      await userEvent.click(within(card('b')).getByRole('button', { name: 'More like this' }));
      await flush();
      expect(saveIssueChoice).toHaveBeenCalledWith(ISSUE, 'b', 'more');
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
      expect(saveIssueChoice).toHaveBeenCalledWith(ISSUE, 'a', 'none');
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
      expect(saveIssueChoice).toHaveBeenLastCalledWith(ISSUE, 'b', 'none');
      expect(within(card('b')).queryByRole('status')).toBeNull();
      expect(toast.success).toHaveBeenCalledTimes(1);
    });

    it('switching More to Less sends less', async () => {
      open('/digest?t=x');
      await userEvent.click(within(card('a')).getByRole('button', { name: 'Less like this' }));
      await flush();
      expect(saveIssueChoice).toHaveBeenCalledWith(ISSUE, 'a', 'less');
      expect(within(card('a')).getByRole('button', { name: 'Less like this' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('a failed press keeps the last saved state and shows an error toast', async () => {
      saveIssueChoice.mockRejectedValueOnce(new Error('down'));
      open('/digest?t=x');
      await userEvent.click(within(card('a')).getByRole('button', { name: 'Less like this' }));
      await flush();
      expect(within(card('a')).getByRole('button', { name: 'More like this' })).toHaveAttribute('aria-pressed', 'true');
      expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it('applies only the latest of two overlapping presses', async () => {
      const pending: Array<(value: unknown) => void> = [];
      saveIssueChoice.mockImplementation(
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
      useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
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
      useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
    });
  });
});

describe('topics (LAB-3289)', () => {
  // The rail and the section after the header both render the card (CSS shows one): act on the first.
  const topicsCard = () => screen.getAllByRole('group', { name: 'Suggested topics' })[0];
  const ownTopics = () => screen.queryAllByRole('group', { name: 'Your topics' })[0] ?? null;
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

  describe('topics section (LAB-3348)', () => {
    it('shows the member’s own topics as ticked chips above the suggestions, and unticks one to save', async () => {
      signIn();
      mockPrefs = { newsTags: ['ai', 'web3'] };
      saveSucceeds();
      open('/digest?t=x');
      const own = ownTopics() as HTMLElement;
      expect(
        within(own)
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual(['#ai', '#web3']);
      expect(within(own).getByRole('button', { name: '#ai' })).toHaveAttribute('aria-pressed', 'true');
      // "Your topics" comes before "Suggested topics" in the card.
      const labels = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
      expect(labels.slice(0, 2)).toEqual(['Your topics', 'Suggested topics']);

      await userEvent.click(within(own).getByRole('button', { name: '#ai' }));
      await userEvent.click(screen.getAllByRole('button', { name: 'Save topics' })[0]);
      expect(setNewsTags).toHaveBeenCalledWith(['web3'], expect.anything());
    });

    it('says "N selected" instead of chips once the member has more than five topics', () => {
      signIn();
      mockPrefs = { newsTags: ['ai', 'web3', 'llms', 'zk', 'dao', 'nft', 'rwa', 'gaming'] };
      open('/digest?t=x');
      expect(screen.getAllByText('8 selected').length).toBeGreaterThan(0);
      expect(ownTopics()).toBeNull();
      expect(
        within(topicsCard())
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual(['#defi', '#desci']);
    });

    it('shows a signed-out reader only the suggestions, never the link member’s topics', () => {
      useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
      open('/digest?t=x');
      expect(screen.queryByText('Your topics')).toBeNull();
      expect(screen.queryByText(/selected$/)).toBeNull();
      expect(topicsCard()).toBeInTheDocument();
    });

    it('drops the "Suggested topics" label when there is nothing to suggest', () => {
      signIn();
      mockPrefs = { newsTags: ['ai'] };
      open('/digest?t=x', data({ topics: { followed: [{ slug: 'ai', title: 'AI' }], suggested: [] } }));
      expect(screen.queryByText('Suggested topics')).toBeNull();
      expect(within(ownTopics() as HTMLElement).getByRole('button', { name: '#ai' })).toBeInTheDocument();
    });

    it('opens with "How personalization works" above Add topics, before the stories, under a line on what the digest is', () => {
      signIn();
      mockPrefs = { newsTags: ['ai'] };
      open('/digest?t=x');
      expect(
        screen.getByText('The week’s top stories from across the Protocol Labs network, in one place.'),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Picked for you/)).toBeNull();
      expect(screen.queryByRole('button', { name: 'Change topics' })).toBeNull();
      const h2 = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
      // The section after the header (shown under 1100px) comes first, then the stories; the rail repeats it.
      expect(h2.slice(0, 3)).toEqual(['How personalization works', 'Add topics', 'Story b']);
      expect(h2.filter((t) => t === 'How personalization works')).toHaveLength(2);
    });
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

  it('asks a signed-out reader to sign in with what they pressed, and saves nothing (LAB-3347)', async () => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    open('/digest?t=x');
    await userEvent.click(chip('defi'));
    expect(signInPrompt()).toHaveAccessibleName('Sign in to add #defi');
    expect(
      within(signInPrompt()).getByText('Your topics decide which stories your digest leads with.'),
    ).toBeInTheDocument();
    expect(routerPush).not.toHaveBeenCalled();
    await answerPrompt('Sign in');
    expect(routerPush).toHaveBeenLastCalledWith('/digest?issue=iss-1&topic=defi#login', { scroll: false });
    await userEvent.click(screen.getAllByRole('button', { name: 'See all topics' })[0]);
    expect(signInPrompt()).toHaveAccessibleName('Sign in to choose your topics');
    await answerPrompt('Sign in');
    expect(routerPush).toHaveBeenLastCalledWith('/digest?issue=iss-1&topics=open#login', { scroll: false });
    expect(capture).toHaveBeenCalledWith('digest-topics-sign-in-prompted', expect.objectContaining({ via: 'chip' }));
    expect(capture).toHaveBeenCalledWith('digest-sign-in-prompt-answered', { press: 'topics-chip', action: 'sign-in' });
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
    expect(window.location.search).toBe('?issue=iss-1');
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
    await userEvent.click(screen.getAllByRole('button', { name: 'See all topics' })[0]);
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '#desci' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await flush();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(setNewsTags).not.toHaveBeenCalled();
    expect(capture).toHaveBeenCalledWith('digest-topics-modal-opened', expect.objectContaining({ via: 'see-all' }));
  });

  it('asks a signed-out reader from the email link to sign in first (LAB-3347)', async () => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    open('/digest?t=x&topics=open');
    await flush();
    expect(signInPrompt()).toHaveAccessibleName('Sign in to choose your topics');
    expect(screen.queryByRole('dialog', { name: /Your topics/ })).toBeNull();
    await answerPrompt('Sign in');
    expect(routerPush).toHaveBeenLastCalledWith('/digest?issue=iss-1&topics=open#login', { scroll: false });
  });

  it('leaves the sign-in alone on the way back from Google or GitHub (LAB-3308)', async () => {
    // "See all topics" put `topics=open` in the address, and Google brings the reader back to it signed out: sending
    // them to sign-in again would clear the sign-in that Privy is finishing.
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    open('/digest?t=x&topics=open&privy_oauth_state=s&privy_oauth_provider=google&privy_oauth_code=c');
    await flush();
    expect(routerPush).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalledWith('digest-topics-sign-in-prompted', expect.anything());
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
    const forum = screen.getByRole('heading', { name: 'From the forum' });
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
    const forum = screen.getByRole('heading', { name: 'From the forum' });
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
  const issue = (
    sentAt: string,
    title: string | null,
    isLinkIssue = false,
    uid: string | null = `iss-${sentAt.slice(8, 10)}`,
  ) => ({
    uid,
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
    open('/digest?issue=iss-18', latest, false, 'iss-18');
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

  it('opens on an older issue, marks it, and links each issue by its id, with no token (LAB-3351)', () => {
    open(`/digest?t=${TOKEN}`, data({ issues: three }), false, 'iss-16');
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    const rows = within(rail()!).getAllByRole('link');
    expect(rows.map((row) => row.getAttribute('href'))).toEqual([
      '/digest?issue=iss-18',
      '/digest?issue=iss-16',
      '/digest?issue=iss-12',
    ]);
    expect(rows[1]).toHaveAttribute('aria-current', 'page');
    expect(rows[0]).not.toHaveAttribute('aria-current');
  });

  it('lists an issue with no id without a link (LAB-3351)', () => {
    const issues = [three[0], issue('2026-11-16T09:00:00.000Z', 'Story b', true, null)];
    open('/digest?t=x', data({ issues }));
    const rows = within(rail()!).getAllByRole('listitem');
    expect(within(rows[0]).getByRole('link')).toHaveAttribute('href', '/digest?issue=iss-18');
    expect(within(rows[1]).queryByRole('link')).toBeNull();
    expect(rows[1]).toHaveTextContent('16 November 2026Story b');
  });

  it('saves More on a past issue against that issue (LAB-3351)', async () => {
    useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
    const past = data({ sentAt: '2026-11-12T09:00:00.000Z', issues: three });
    open('/digest?issue=iss-12', past, false, 'iss-12');
    await userEvent.click(within(card('b')).getByRole('button', { name: 'More like this' }));
    await flush();
    expect(saveIssueChoice).toHaveBeenCalledWith('iss-12', 'b', 'more');
    useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
  });
});

describe('the page without the link token (LAB-3351)', () => {
  const OAUTH_RETURN = 'privy_oauth_state=s&privy_oauth_provider=google&privy_oauth_code=c';
  const signedOut = () => useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
  const signedIn = () => useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
  const prompts = () => capture.mock.calls.filter(([name]) => name === 'digest-sign-in-prompted').map(([, p]) => p);
  afterEach(() => useCurrentUserStore.setState({ currentUser: null, isHydrated: false }));

  it('swaps the token in the address for the issue id, keeping every other parameter and the anchor', () => {
    open(`/digest?t=${TOKEN}&utm_source=digest_email_read_more_link&link_type=read_more&position=2#story-b`);
    expect(window.location.search).toBe(
      '?issue=iss-1&utm_source=digest_email_read_more_link&link_type=read_more&position=2',
    );
    expect(window.location.hash).toBe('#story-b');
  });

  it('drops a send-time issue from an older Past issues link', () => {
    open(`/digest?t=${TOKEN}&issue=2026-11-12T09%3A00%3A00.000Z`);
    expect(window.location.search).toBe('?issue=iss-1');
  });

  it('leaves an address that already names the issue alone', () => {
    const replace = jest.spyOn(window.history, 'replaceState');
    open('/digest?issue=iss-1&utm_source=x');
    expect(replace).toHaveBeenCalledTimes(1); // the test's own `open`
    replace.mockRestore();
  });

  it('sends a signed-out More to sign-in with the choice in the address, and saves nothing', async () => {
    signedOut();
    open(`/digest?t=${TOKEN}`);
    await userEvent.click(within(card('b')).getByRole('button', { name: 'More like this' }));
    await flush();
    // LAB-3347: the prompt names the press first; Sign in there carries it through sign-in.
    expect(signInPrompt()).toHaveAccessibleName('Sign in to get more stories like this');
    expect(
      within(signInPrompt()).getByText('Your choice shapes which stories lead your next digest.'),
    ).toBeInTheDocument();
    expect(routerPush).not.toHaveBeenCalled();
    await answerPrompt('Sign in');
    expect(routerPush).toHaveBeenLastCalledWith('/digest?issue=iss-1&story=b&choice=more#login', { scroll: false });
    expect(saveIssueChoice).not.toHaveBeenCalled();
    expect(within(card('b')).getByRole('button', { name: 'More like this' })).toHaveAttribute('aria-pressed', 'false');
    expect(within(card('b')).queryByRole('status')).toBeNull();
    expect(prompts()).toEqual([{ via: 'more', news_id: 'b' }]);
    expect(capture.mock.calls.map(([name]) => name)).not.toContain('digest-more-clicked');
  });

  it('records Less signed out with via less', async () => {
    signedOut();
    open('/digest?issue=iss-1');
    await userEvent.click(within(card('b')).getByRole('button', { name: 'Less like this' }));
    expect(prompts()).toEqual([{ via: 'less', news_id: 'b' }]);
    expect(signInPrompt()).toHaveAccessibleName('Sign in to get fewer stories like this');
  });

  it('does nothing on a press before the sign-in state is known', async () => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
    open('/digest?issue=iss-1');
    await userEvent.click(within(card('b')).getByRole('button', { name: 'More like this' }));
    await flush();
    expect(routerPush).not.toHaveBeenCalled();
    expect(saveIssueChoice).not.toHaveBeenCalled();
  });

  it('asks a signed-out reader of an email More / Less link to sign in once, and saves after it', async () => {
    signedOut();
    open('/digest?issue=iss-1&story=b&choice=less', data(), true);
    await flush();
    // LAB-3347: the page scrolls to the story and the prompt names the press; nothing shows pressed.
    expect(signInPrompt()).toHaveAccessibleName('Sign in to get fewer stories like this');
    expect(card('b').scrollIntoView).toHaveBeenCalled();
    expect(within(card('b')).getByRole('button', { name: 'Less like this' })).toHaveAttribute('aria-pressed', 'false');
    expect(routerPush).not.toHaveBeenCalled();
    await answerPrompt('Sign in');
    expect(routerPush).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenLastCalledWith('/digest?issue=iss-1&story=b&choice=less#login', { scroll: false });
    expect(prompts()).toEqual([{ via: 'email-choice', news_id: 'b' }]);
    expect(saveIssueChoice).not.toHaveBeenCalled();

    // Sign-in finishes without a reload: the choice is saved once, for the reader, and leaves the address.
    act(() => signedIn());
    await flush();
    expect(saveIssueChoice).toHaveBeenCalledTimes(1);
    expect(saveIssueChoice).toHaveBeenCalledWith('iss-1', 'b', 'less');
    expect(within(card('b')).getByRole('status')).toHaveTextContent('You’ll get fewer stories like this');
    expect(window.location.search).toBe('?issue=iss-1');
  });

  it('starts no sign-in while a Google or GitHub sign-in is returning, and saves once it has', async () => {
    signedOut();
    open(`/digest?issue=iss-1&story=b&choice=more&${OAUTH_RETURN}`);
    await flush();
    expect(routerPush).not.toHaveBeenCalled();
    expect(saveIssueChoice).not.toHaveBeenCalled();
    act(() => signedIn());
    await flush();
    expect(saveIssueChoice).toHaveBeenCalledTimes(1);
  });

  it('never sends or shows the token after the swap', async () => {
    signedIn();
    open(`/digest?t=${TOKEN}&link_type=more&story=a&choice=less`);
    await flush();
    await userEvent.click(within(card('b')).getByRole('button', { name: 'More like this' }));
    await flush();
    expect(saveIssueChoice).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(saveIssueChoice.mock.calls)).not.toContain(TOKEN);
    expect(JSON.stringify(capture.mock.calls)).not.toContain(TOKEN);
    expect(document.body.innerHTML).not.toContain(TOKEN);
    expect(window.location.href).not.toContain(TOKEN);
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

describe('From the forum (LAB-3293)', () => {
  const forumPost = (tid: number, title: string, replyCount: number) => ({
    tid,
    title,
    authorName: 'Sam',
    authorRole: null,
    authorTeam: null,
    authorAvatarUrl: null,
    contentHtml: '<p>x</p>',
    url: `https://web/forum/topics/1/${tid}`,
    replyCount,
  });
  const threads = [forumPost(7, 'Busy thread', 14), forumPost(8, 'Quiet thread', 1)];
  const feedPost = (tid: number, title: string) => ({
    uid: `fp_${tid}`,
    tid,
    mainPid: tid * 10,
    title,
    body: '',
    author: { memberUid: 'author', name: 'Sam', role: null, avatarUrl: null },
    likeCount: 2,
    viewerHasLiked: false,
  });
  const section = () => screen.getByRole('heading', { name: 'From the forum' }).closest('section') as HTMLElement;

  afterEach(() => {
    mockFeedPosts = [];
    mockFeedLoading = false;
    mockForumAccess = true;
    // Likes are remembered in the local like store, as on Home.
    window.localStorage.clear();
    useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
  });

  it('numbers the threads with their replies, and ends on Open the forum', () => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    open('/digest?t=x', data({ forumPosts: threads }));
    expect(within(section()).getByText('Top threads from the past week.')).toBeInTheDocument();
    const rows = within(section()).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual(['1.Busy thread14 replies', '2.Quiet thread1 reply']);
    // Older emails link to #post-<tid>: the row is still the anchor.
    expect(rows[0]).toHaveAttribute('id', 'post-7');
    expect(within(section()).getByRole('link', { name: 'Open the forum →' })).toHaveAttribute('href', '/forum');
  });

  it('asks a signed-out reader to sign in from a thread, and opens nothing (LAB-3348)', async () => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    open('/digest?t=x', data({ forumPosts: threads }));
    expect(within(section()).queryByRole('link', { name: /Quiet thread/ })).toBeNull();
    await userEvent.click(within(section()).getByRole('button', { name: /Quiet thread/ }));
    expect(signInPrompt()).toHaveAccessibleName('Sign in to read this thread');
    expect(
      within(signInPrompt()).getByText('Forum threads are open to Protocol Labs network members.'),
    ).toBeInTheDocument();
    await answerPrompt('Sign in');
    expect(routerPush).toHaveBeenLastCalledWith('/digest?issue=iss-1&post=8#login', { scroll: false });
    expect(capture).toHaveBeenCalledWith('digest-sign-in-prompted', { via: 'forum-post', topic_id: 8, position: 1 });
    expect(capture).not.toHaveBeenCalledWith('digest-forum-thread-clicked', expect.anything());
    expect(leavePage).not.toHaveBeenCalled();
    expect(screen.queryByTestId('forum-modal')).toBeNull();
  });

  it('asks a signed-out reader to sign in from Open the forum, then goes on to the forum (LAB-3347)', async () => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    open('/digest?t=x', data({ forumPosts: threads }));
    await userEvent.click(within(section()).getByRole('link', { name: 'Open the forum →' }));
    expect(signInPrompt()).toHaveAccessibleName('Sign in to open the forum');
    expect(capture).not.toHaveBeenCalledWith('digest-forum-open-clicked', expect.anything());
    expect(capture).toHaveBeenCalledWith('digest-sign-in-prompted', { via: 'forum-open' });
    await answerPrompt('Sign up');
    expect(routerPush).toHaveBeenLastCalledWith(`/sign-up?returnTo=${encodeURIComponent('/forum')}`);
    await userEvent.click(within(section()).getByRole('link', { name: 'Open the forum →' }));
    await answerPrompt('Sign in');
    expect(routerPush).toHaveBeenLastCalledWith('/forum#login', { scroll: false });
  });

  it('keeps a thread a link to the forum until the reader is known', () => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: false });
    open('/digest?t=x', data({ forumPosts: threads }));
    expect(within(section()).getByRole('link', { name: /Quiet thread/ })).toHaveAttribute(
      'href',
      'https://web/forum/topics/1/8',
    );
  });

  it('back from sign-in, opens the thread they pressed in the modal, once, and clears it from the address', async () => {
    mockFeedPosts = [feedPost(7, 'Busy thread')];
    useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
    open('/digest?t=x&post=7', data({ forumPosts: threads }));
    await flush();
    expect(screen.getByTestId('forum-modal')).toHaveTextContent('Busy thread');
    expect(capture).toHaveBeenCalledTimes(2);
    expect(capture).toHaveBeenCalledWith(
      'digest-forum-thread-clicked',
      expect.objectContaining({ topic_id: 7, position: 0, opens: 'modal' }),
    );
    expect(window.location.search).toBe('?issue=iss-1');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('forum-modal')).toBeNull();
    expect(leavePage).not.toHaveBeenCalled();
  });

  it('back from sign-in, sends them to the forum for a thread the modal can’t show', async () => {
    mockFeedPosts = [feedPost(7, 'Busy thread')];
    useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
    open('/digest?t=x&post=8', data({ forumPosts: threads }));
    await flush();
    expect(leavePage).toHaveBeenCalledTimes(1);
    expect(leavePage).toHaveBeenCalledWith('https://web/forum/topics/1/8');
    expect(screen.queryByTestId('forum-modal')).toBeNull();
  });

  it('back from sign-in, waits for the feed before choosing the modal or the forum', async () => {
    mockFeedPosts = [feedPost(7, 'Busy thread')];
    mockFeedLoading = true;
    useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
    const page = data({ forumPosts: threads });
    const { rerender } = open('/digest?t=x&post=7', page);
    await flush();
    expect(leavePage).not.toHaveBeenCalled();
    expect(screen.queryByTestId('forum-modal')).toBeNull();
    mockFeedLoading = false;
    rerender(<DigestPage key={ISSUE} issueUid={ISSUE} data={page} isLoggedIn={false} />);
    await flush();
    expect(screen.getByTestId('forum-modal')).toHaveTextContent('Busy thread');
    expect(leavePage).not.toHaveBeenCalled();
  });

  it('opens nothing for a thread the page doesn’t list', async () => {
    mockFeedPosts = [feedPost(7, 'Busy thread')];
    useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
    open('/digest?t=x&post=99', data({ forumPosts: threads }));
    await flush();
    expect(leavePage).not.toHaveBeenCalled();
    expect(screen.queryByTestId('forum-modal')).toBeNull();
  });

  it('opens a thread in Home’s forum modal for a signed-in member with forum access, and likes it there', async () => {
    mockFeedPosts = [feedPost(7, 'Busy thread')];
    useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
    open('/digest?t=x', data({ forumPosts: threads }));
    // A thread the member's feed doesn't have still links to the forum.
    expect(within(section()).getByRole('link', { name: /Quiet thread/ })).toBeInTheDocument();
    await userEvent.click(within(section()).getByRole('button', { name: /Busy thread/ }));
    expect(capture).toHaveBeenCalledWith(
      'digest-forum-thread-clicked',
      expect.objectContaining({ topic_id: 7, position: 0, opens: 'modal' }),
    );
    expect(screen.getByTestId('forum-modal')).toHaveTextContent('Busy thread · 2 likes · not liked');
    await userEvent.click(screen.getByRole('button', { name: 'Like' }));
    expect(likeMutate).toHaveBeenCalledWith(
      { post: expect.objectContaining({ uid: 'fp_7', mainPid: 70 }), isLiked: true },
      expect.anything(),
    );
    expect(screen.getByTestId('forum-modal')).toHaveTextContent('Busy thread · 3 likes · liked');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('forum-modal')).toBeNull();
  });

  it('rolls the like back when it fails', async () => {
    likeMutate.mockImplementationOnce((_vars, { onError }) => onError(new Error('nope')));
    mockFeedPosts = [feedPost(7, 'Busy thread')];
    useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
    open('/digest?t=x', data({ forumPosts: threads }));
    await userEvent.click(within(section()).getByRole('button', { name: /Busy thread/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Like' }));
    expect(screen.getByTestId('forum-modal')).toHaveTextContent('Busy thread · 2 likes · not liked');
  });

  it('links to the forum for a signed-in member without forum access', () => {
    mockForumAccess = false;
    mockFeedPosts = [feedPost(7, 'Busy thread')];
    useCurrentUserStore.setState({ currentUser: { uid: 'me' } as any, isHydrated: true });
    open('/digest?t=x', data({ forumPosts: threads }));
    expect(within(section()).queryByRole('button', { name: /Busy thread/ })).toBeNull();
    expect(within(section()).getByRole('link', { name: /Busy thread/ })).toHaveAttribute(
      'href',
      'https://web/forum/topics/1/7',
    );
  });
});

describe('post your team news (LAB-3313)', () => {
  const post = () => userEvent.click(screen.getByRole('button', { name: 'Post your team news →' }));

  beforeEach(() => {
    mockMember = undefined;
    useCurrentUserStore.setState({ currentUser: { uid: 'me' }, isHydrated: true });
  });
  afterEach(() => useCurrentUserStore.setState({ currentUser: null, isHydrated: false }));

  it('opens the Post news modal for a member of one team', async () => {
    mockMember = memberWith(role('team-1', 'Lattice'));
    open('/digest?t=x', data({ isTeamMember: true }));
    expect(screen.queryByRole('dialog', { name: 'Post news' })).toBeNull();
    await post();
    expect(screen.getByRole('dialog', { name: 'Post news' })).toHaveTextContent('Published as Lattice');
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('asks a member of more than one team which team, main team first, then opens the modal for it', async () => {
    mockMember = memberWith(role('team-1', 'Lattice'), role('team-2', 'Aave', true));
    open('/digest?t=x', data({ isTeamMember: true }));
    await post();
    expect(screen.queryByRole('dialog', { name: 'Post news' })).toBeNull();
    const choice = screen.getByRole('group', { name: 'Post as' });
    expect(
      within(choice)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Aave', 'Lattice']);
    await userEvent.click(within(choice).getByRole('button', { name: 'Lattice' }));
    expect(screen.getByRole('dialog', { name: 'Post news' })).toHaveTextContent('Published as Lattice');
    expect(screen.queryByRole('group', { name: 'Post as' })).toBeNull();
  });

  it('hides the card from a signed-in member on no team', () => {
    mockMember = memberWith();
    open('/digest?t=x', data({ isTeamMember: true }));
    expect(screen.queryByText('Got news from your team?')).toBeNull();
  });

  it('acts on the email’s postnews=open once signed in, and drops it from the address', async () => {
    mockMember = memberWith(role('team-1', 'Lattice'));
    open('/digest?t=x&link_type=post_news&postnews=open', data({ isTeamMember: true }));
    await flush();
    expect(screen.getByRole('dialog', { name: 'Post news' })).toHaveTextContent('Published as Lattice');
    expect(window.location.search).toBe('?issue=iss-1&link_type=post_news');
  });

  it('brings the team question into view when the email lands a member of more than one team', async () => {
    mockMember = memberWith(role('team-1', 'Lattice'), role('team-2', 'Aave'));
    open('/digest?t=x&postnews=open', data({ isTeamMember: true }));
    await flush();
    expect(screen.getByRole('group', { name: 'Post as' })).toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('sends the email’s postnews=open to sign-in when signed out, and keeps it in the address', async () => {
    useCurrentUserStore.setState({ currentUser: null, isHydrated: true });
    open('/digest?t=x&postnews=open', data({ isTeamMember: true }));
    await flush();
    expect(routerPush).toHaveBeenCalledWith('/digest?issue=iss-1&postnews=open#login', { scroll: false });
    expect(screen.queryByRole('dialog', { name: 'Post news' })).toBeNull();
  });
});
