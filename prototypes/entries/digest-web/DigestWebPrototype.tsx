'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { toast } from '@/components/core/ToastContainer';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
// The feed card's team header (logo, name, Follow), production NewsCard's classes 1:1.
import nc from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import { Check, MegaphoneSimple } from '@phosphor-icons/react';

import { FollowButton } from '../follow-shared/FollowButton';
import { CommentsThread } from '../newsfeed-v0/CommentsThread';
import { CommentButton } from '../newsfeed-v0/FeedActions';
import { ForumPostModal } from '../newsfeed-v0/ForumPostModal';
import type { FeedComment, ForumPost } from '../newsfeed-v0/mocks';
import { ShareMenu } from '../newsfeed-v0/ShareMenu';
import { PostNewsModal } from '../team-profile/PostNewsModal';

import logoLattice from './assets/logo-lattice-compute.svg';
import logoOptimism from './assets/logo-optimism.svg';
import logoProprio from './assets/logo-proprio-labs.svg';
import logoStarknet from './assets/logo-starknet.svg';
import plLogo from './assets/pl-logo.png';
import thumbsDown from './assets/thumbs-down.svg';
import thumbsUp from './assets/thumbs-up.svg';
import { AllTopicsModal } from './AllTopicsModal';
import { DigestEvents } from './DigestEvents';
import { DigestForum } from './DigestForum';
import { DigestNetworkNews } from './DigestNetworkNews';
import { DigestSidebar, type PastIssue } from './DigestSidebar';
import { SignInAskModal } from './SignInAskModal';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import {
  DIGEST_COMMENTS,
  DIGEST_FORUM_POSTS,
  DIGEST_ISSUE,
  DIGEST_STORIES,
  DIGEST_TOPICS,
  type DigestForumPost,
  type DigestStory,
  type Feedback,
} from './mocks';

import s from './DigestWebPrototype.module.scss';

/**
 * The web version of one digest issue: the email's layout, with every story open in full.
 * A More / Less like this link in the email lands here (?story=<id>&feedback=more|less),
 * scrolled to that story, and the page — not the link's GET — records the press,
 * so link scanners never change anyone's topics. The receipt sits inside the story's card.
 *
 * ?view=email shows the digest as the email (summaries, Read More) so the click can be tried:
 * its More / Less like this are plain links into this page, and Read More opens the page
 * scrolled to the story with no feedback.
 */
/**
 * Signed-out reader (LAB-3347, 2026-11-20; review switch "Signed out", `?auth=out`). They read
 * everything: every story in full, Sources, Share, More from the network, Upcoming events, the
 * forum's titles and reply counts, Past issues. Anything that needs a member opens one sign-in
 * prompt (`SignInAskModal`) whose title names the press, and signing in finishes it:
 *   More / Less like this → saved, with the receipt;   a forum thread → it opens;
 *   a topic chip → the card comes back with it ticked;  See all topics → the modal opens;
 *   Follow → followed;   Comments → the thread opens;   Open the forum → the forum.
 * Arriving from the email's More / Less link signed out scrolls to the story and opens the prompt
 * for that press; nothing is saved before sign-in. The greeting is "Hi there,". "Got news from
 * your team?" is hidden: it's for team members, and a signed-out reader's team is unknown.
 */
type SignInAsk =
  | { kind: 'feedback'; storyId: string; feedback: Feedback }
  | { kind: 'post'; postId: string }
  | { kind: 'forum' }
  | { kind: 'topic'; topic: string }
  | { kind: 'topics' }
  | { kind: 'personalize' }
  | { kind: 'follow'; team: string }
  | { kind: 'comments'; storyId: string };

const TOPICS_WHY = 'Your topics decide which stories your digest leads with.';
const MEMBERS_WHY = 'Forum threads are open to Protocol Labs network members.';

/** The prompt's title names the press; the line says why it needs an account. */
function askCopy(ask: SignInAsk): { title: string; body: string } {
  switch (ask.kind) {
    case 'feedback':
      return {
        title:
          ask.feedback === 'more' ? 'Sign in to get more stories like this' : 'Sign in to get fewer stories like this',
        body: 'Your choice shapes which stories lead your next digest.',
      };
    case 'post':
      return { title: 'Sign in to read this thread', body: MEMBERS_WHY };
    case 'forum':
      return { title: 'Sign in to open the forum', body: MEMBERS_WHY };
    case 'topic':
      return { title: `Sign in to add #${ask.topic}`, body: TOPICS_WHY };
    case 'topics':
      return { title: 'Sign in to choose your topics', body: TOPICS_WHY };
    case 'personalize':
      return {
        title: 'Sign in to personalize your digest',
        body: 'Pick topics and follow teams, and your digest leads with them.',
      };
    case 'follow':
      return { title: `Sign in to follow ${ask.team}`, body: 'Their news comes first in your feed and your digest.' };
    case 'comments':
      return { title: 'Sign in to read and add comments', body: 'Comments on network stories are open to members.' };
  }
}

export default function DigestWebPrototype() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const signedIn = params.get('auth') !== 'out';
  /** A review-switch link that keeps the reader's signed-in state. */
  const withAuth = (query: string) => {
    const p = new URLSearchParams(query);
    if (!signedIn) p.set('auth', 'out');
    const q = p.toString();
    return q ? `?${q}` : '?';
  };
  const landedStory = params.get('story');
  const rawFeedback = params.get('feedback');
  const landedFeedback: Feedback | null = rawFeedback === 'more' || rawFeedback === 'less' ? rawFeedback : null;
  const isEmail = params.get('view') === 'email';
  // "Send us your team news": the team profile's Post news modal. The email's link lands
  // here with ?postnews=open.
  const [composeOpen, setComposeOpen] = useState(() => !isEmail && params.get('postnews') === 'open');
  const landed = !isEmail && landedStory && DIGEST_STORIES.some((x) => x.id === landedStory) ? landedStory : null;

  // The reader's topics (mocked, this visit only), shared by the side card and the All topics
  // modal. The modal opens from the card's See all topics and from the greeting's Change topics;
  // the email's Change topics lands here with ?topics=open.
  const [topics, setTopics] = useState<string[]>(DIGEST_TOPICS);
  const [topicsOpen, setTopicsOpen] = useState(() => !isEmail && params.get('topics') === 'open');
  const saveTopics = (next: string[]) => {
    setTopics(next);
    setTopicsOpen(false);
    toast.success('Topics saved. Your next digest uses them.');
  };

  // Signed out, the email's More / Less press is not saved on landing: the prompt asks first.
  const [feedback, setFeedback] = useState<Record<string, Feedback | undefined>>(() =>
    landed && landedFeedback && signedIn ? { [landed]: landedFeedback } : {},
  );
  // The landing receipt sits at the top of the card, where the scroll puts the reader's eye
  // (a full story is taller than a phone screen, so a receipt under the buttons is off-screen).
  // Once the reader presses on the page, it moves under the buttons they pressed.
  const [receiptAtTop, setReceiptAtTop] = useState<string | null>(landed && landedFeedback && signedIn ? landed : null);

  // The sign-in prompt and the press it is holding (signed out only).
  const [ask, setAsk] = useState<SignInAsk | null>(() =>
    !signedIn && landed && landedFeedback ? { kind: 'feedback', storyId: landed, feedback: landedFeedback } : null,
  );
  // A chip pressed signed out comes back ticked on the card after sign-in.
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  // Story comments, as Home's feed holds them (mocked, this visit only): the thread opens
  // under the story from its Comments button, one story at a time or several, like the feed.
  const [comments, setComments] = useState<Record<string, FeedComment[]>>(DIGEST_COMMENTS);
  const [openThreads, setOpenThreads] = useState<Set<string>>(() => new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(() => new Set());
  const toggleInSet = (setter: typeof setOpenThreads, key: string) =>
    setter((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const addComment = (storyId: string, text: string, parentUid?: string) =>
    setComments((prev) => {
      const existing = prev[storyId] ?? [];
      const comment: FeedComment = {
        uid: `c-${storyId}-new-${existing.length + 1}`,
        author: 'You',
        role: 'Member @ Protocol Labs',
        text,
        createdAt: new Date().toISOString(),
        parentUid,
      };
      return { ...prev, [storyId]: [...existing, comment] };
    });

  // The forum post open in Home's forum modal (web page only), and the posts liked there.
  // A post's comments live in `comments` under `post-<id>`.
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(() => new Set());
  const openPost = DIGEST_FORUM_POSTS.find((p) => p.id === openPostId);
  const postKey = (id: string) => `post-${id}`;

  // Teams followed from this page (mocked, this visit only).
  const [followed, setFollowed] = useState<Set<string>>(() => new Set());
  const toggleFollow = (team: string) =>
    setFollowed((current) => {
      const next = new Set(current);
      if (next.has(team)) next.delete(team);
      else next.add(team);
      return next;
    });

  // The navbar has menus and portals, so it renders after mount, the way Home's does.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Which issue is open: ?issue=<date> from the Past issues list, else this week's.
  // Mock: every past issue shows this week's stories; only the dateline changes.
  const rawIssue = params.get('issue');
  const issueId = PAST_ISSUES.some((x) => x.id === rawIssue) ? rawIssue! : DIGEST_ISSUE.id;

  useEffect(() => {
    if (!mounted || !landed) return;
    // Scroll only: no highlight on the story. Waits for the navbar so its height is counted.
    document.getElementById(`story-${landed}`)?.scrollIntoView({ block: 'start' });
    // Runs once for the landing only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const press = (id: string, next: Feedback) => {
    if (receiptAtTop === id) setReceiptAtTop(null);
    // Pressing the active button again is the same as Undo.
    if (feedback[id] === next) return undo(id);
    setFeedback((current) => ({ ...current, [id]: next }));
  };

  const undo = (id: string) => {
    setFeedback((current) => ({ ...current, [id]: undefined }));
    toast.success('Undone. Your preferences haven’t changed.');
  };

  /** Signed in: do it. Signed out: hold it and ask. */
  const gate = (pending: SignInAsk, act: () => void) => (signedIn ? act() : setAsk(pending));

  /** Mocked sign-in (production opens Privy and returns here): flips the page to signed in,
   *  then finishes the press the prompt was holding. */
  const signIn = (pending: SignInAsk | null) => {
    const p = new URLSearchParams(params.toString());
    p.delete('auth');
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    setAsk(null);
    if (!pending) return;
    switch (pending.kind) {
      case 'feedback':
        setFeedback((current) => ({ ...current, [pending.storyId]: pending.feedback }));
        break;
      case 'post':
        setOpenPostId(pending.postId);
        break;
      case 'forum':
        router.push('/forum');
        break;
      case 'topic':
        setPendingTopic(pending.topic);
        break;
      case 'topics':
        setTopicsOpen(true);
        break;
      case 'follow':
        toggleFollow(pending.team);
        break;
      case 'comments':
        setOpenThreads((current) => new Set(current).add(pending.storyId));
        break;
      case 'personalize':
        break;
    }
  };

  return (
    <>
      {/* Platform navigation on the web version only; the Email view is an inbox, not the platform. */}
      {mounted && !isEmail && (
        <>
          <PrototypeNavBar
            hasUnreadNews={false}
            newsHref="/home"
            eventsInMore
            isLoggedIn={signedIn}
            onSignIn={() => signIn(null)}
          />
          <PrototypeMobileNav hasUnreadNews={false} />
        </>
      )}
      <div className={`${s.page} ${isEmail ? '' : s.pageWeb}`}>
        {/* Prototype-only switch: not part of the email or the page. */}
        <nav className={s.viewSwitch} aria-label="Prototype view">
          <a href={withAuth('view=email')} className={isEmail ? s.viewSwitchActive : undefined}>
            Email
          </a>
          {/* The two ways the page is opened from the email. */}
          <a
            href={withAuth('story=starknet-l1&feedback=more')}
            className={landed && landedFeedback ? s.viewSwitchActive : undefined}
          >
            From More / Less like this
          </a>
          <a
            href={withAuth('story=starknet-l1')}
            className={landed && !landedFeedback ? s.viewSwitchActive : undefined}
          >
            From Read More
          </a>
        </nav>
        {/* Prototype-only: who is reading (LAB-3347). Keeps the current view. */}
        {!isEmail && (
          <nav className={s.viewSwitch} aria-label="Reader">
            <a
              href={(() => {
                const p = new URLSearchParams(params.toString());
                p.delete('auth');
                return `?${p.toString()}`;
              })()}
              className={signedIn ? s.viewSwitchActive : undefined}
            >
              Signed in
            </a>
            <a
              href={(() => {
                const p = new URLSearchParams(params.toString());
                p.set('auth', 'out');
                return `?${p.toString()}`;
              })()}
              className={!signedIn ? s.viewSwitchActive : undefined}
            >
              Signed out
            </a>
          </nav>
        )}

        <div className={isEmail ? undefined : s.webLayout}>
          <article className={s.email}>
            {/* Email only: on the web page the platform navbar already says where you are. */}
            {isEmail && (
              <div className={s.logoRow}>
                <img src={plLogo.src} alt="Protocol Labs" width={144} height={32} />
              </div>
            )}

            {/* Web only: which issue this is (Medium Daily Digest / Substack's dateline). */}
            {!isEmail && (
              <p className={s.issueLine}>
                Weekly digest · {formatIssueDate(issueId)} · {DIGEST_STORIES.length} stories
              </p>
            )}

            <header className={s.intro}>
              <h1 className={s.greeting}>Hi {signedIn ? DIGEST_ISSUE.greetingName : 'there'},</h1>
              {/* Web (manager, 2026-11-20): the How personalization works card explains the picks,
                  so the line under the greeting only says what the digest is. The email has no
                  side column, so it keeps one line in the card's words plus Change topics, a link
                  that lands on this page with the All topics modal open. */}
              {isEmail ? (
                <p className={s.introText}>
                  {DIGEST_ISSUE.intro}{' '}
                  <a href="?topics=open" className={s.introLink}>
                    Change topics
                  </a>
                </p>
              ) : (
                <p className={s.introText}>{DIGEST_ISSUE.description}</p>
              )}
            </header>

            {!isEmail && topicsOpen && (
              <AllTopicsModal subscribed={topics} onClose={() => setTopicsOpen(false)} onSave={saveTopics} />
            )}

            <div className={s.spacer} />

            {/* Web: every story in full, one column. The top story is Perplexity Discover's wide
                card (text beside a big picture); the rest carry the picture beside the text,
                alternating sides as the email does. The email keeps Figma's rows. */}
            <div className={s.cards}>
              {DIGEST_STORIES.map((story, i) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  asEmail={isEmail}
                  layout={isEmail ? 'email' : i === 0 ? 'hero' : 'row'}
                  following={followed.has(story.team)}
                  onFollow={() => gate({ kind: 'follow', team: story.team }, () => toggleFollow(story.team))}
                  feedback={feedback[story.id]}
                  receiptAtTop={receiptAtTop === story.id}
                  onPress={(next) =>
                    gate({ kind: 'feedback', storyId: story.id, feedback: next }, () => press(story.id, next))
                  }
                  onUndo={() => undo(story.id)}
                  thread={{
                    comments: comments[story.id] ?? [],
                    open: openThreads.has(story.id),
                    onToggle: () =>
                      gate({ kind: 'comments', storyId: story.id }, () => toggleInSet(setOpenThreads, story.id)),
                    onAdd: (text, parentUid) => addComment(story.id, text, parentUid),
                    isLiked: (uid) => likedComments.has(uid),
                    onToggleLike: (uid) => toggleInSet(setLikedComments, uid),
                  }}
                />
              ))}
            </div>

            <div className={s.spacer} />
            <DigestNetworkNews asEmail={isEmail} id={`story-${NEWS_SECTION}`} />

            <div className={s.spacer} />
            <DigestEvents asEmail={isEmail} id={`story-${EVENTS_SECTION}`} />

            <div className={s.spacer} />
            {/* A row opens the post in Home's forum modal (full post, likes, comments); in the
                email it links to the forum. */}
            <DigestForum
              asEmail={isEmail}
              id={`story-${FORUM_SECTION}`}
              onOpenPost={(postId) => gate({ kind: 'post', postId }, () => setOpenPostId(postId))}
              onOpenForum={signedIn ? undefined : () => setAsk({ kind: 'forum' })}
              extraReplies={(postId) => (comments[postKey(postId)] ?? []).length}
            />

            {!isEmail && (
              <ForumPostModal
                post={openPost ? toForumPost(openPost) : null}
                onClose={() => setOpenPostId(null)}
                likeCount={openPost ? FORUM_LIKES[openPost.id] + (likedPosts.has(openPost.id) ? 1 : 0) : 0}
                liked={!!openPost && likedPosts.has(openPost.id)}
                onToggleLike={() => openPost && toggleInSet(setLikedPosts, openPost.id)}
                comments={openPost ? (comments[postKey(openPost.id)] ?? []) : []}
                onAddComment={(text, parentUid) => openPost && addComment(postKey(openPost.id), text, parentUid)}
                isCommentLiked={(uid) => likedComments.has(uid)}
                onToggleCommentLike={(uid) => toggleInSet(setLikedComments, uid)}
              />
            )}

            {/* Web only: a clear end to the issue (Substack / Pinterest "all caught up"),
                with when the next one comes and where to keep reading. */}
            {!isEmail && (
              <section className={s.caughtUp} aria-label="End of this issue">
                <span className={s.caughtUpMark} aria-hidden>
                  <Check size={16} weight="bold" />
                </span>
                <p className={s.caughtUpTitle}>You’re all caught up</p>
                <p className={s.caughtUpText}>The next digest arrives on {NEXT_ISSUE_DATE}.</p>
                <a href="/prototypes/homepage" className={s.caughtUpLink}>
                  See all network news
                </a>
              </section>
            )}

            {/* Under 1100px there's no room beside the column: the side cards close the page instead. */}
            {!isEmail && (
              <DigestSidebar
                variant="inline"
                currentIssue={issueId}
                latestIssue={DIGEST_ISSUE.id}
                pastIssues={PAST_ISSUES}
                formatDate={(id) => formatIssueDate(id, 'short')}
                subscribed={signedIn ? topics : []}
                onSaveTopics={saveTopics}
                onOpenAllTopics={() => setTopicsOpen(true)}
                signedIn={signedIn}
                onAskSignIn={setAsk}
                pendingTopic={pendingTopic}
              />
            )}

            {/* The digest asks for content: on the page it opens the team profile's Post news
                modal; in the email it lands on the page with that modal open. */}
            {/* Team members only, so hidden from a signed-out reader (their team is unknown). */}
            {signedIn && (
              <section className={s.sendNews} aria-label="Send us your team news">
                {/* Left-aligned with a mark on the left (Polina, 2026-11-17): a megaphone, the
                  product's "announce" glyph, in the brand-soft tile. */}
                <span className={s.sendNewsIcon} aria-hidden>
                  <MegaphoneSimple size={20} />
                </span>
                <div className={s.sendNewsBody}>
                  <p className={s.sendNewsTitle}>Got news from your team?</p>
                  <p className={s.sendNewsText}>
                    {/* "Post", not "send" (Anuj, 2026-11-16): nobody reviews it first, it goes
                      straight onto the feed. */}
                    Post it here and it goes straight onto the network feed. The best of the week makes the next digest.
                  </p>
                  {isEmail ? (
                    <a href="/prototypes/digest-web?postnews=open" className={s.sendNewsLink}>
                      Post your team news →
                    </a>
                  ) : (
                    <button type="button" className={s.sendNewsLink} onClick={() => setComposeOpen(true)}>
                      Post your team news →
                    </button>
                  )}
                </div>
              </section>
            )}

            <SignInAskModal
              ask={ask ? askCopy(ask) : null}
              onClose={() => setAsk(null)}
              onSignIn={() => signIn(ask)}
              onSignUp={() => signIn(ask)}
            />

            {!isEmail && (
              <PostNewsModal
                open={composeOpen}
                onClose={() => setComposeOpen(false)}
                teamUid={VIEWER_TEAM.uid}
                teamName={VIEWER_TEAM.name}
                existing={[]}
                onPublish={() => {
                  setComposeOpen(false);
                  toast.success('Posted. It’s on the network feed now.');
                }}
              />
            )}

            <footer>
              <div className={s.signoff}>
                <p className={s.signoffStrong}>Cheers,</p>
                <p className={s.signoffTeam}>The Protocol Labs team</p>
              </div>
              <div className={s.footerDivider}>
                <span className={s.dividerLine} />
              </div>
              <div className={s.legal}>
                <p>You received this email because you are a member of the Protocol Labs network.</p>
                <nav className={s.legalLinks}>
                  {/* No frequency switch: the digest is weekly only (Anuj, 2026-11-16). */}
                  <a href="#">Manage preferences</a>
                  <a href="#">Unsubscribe</a>
                </nav>
              </div>
            </footer>
          </article>

          {/* Web only, 1100px and up: the side cards as a sticky column on the right. */}
          {!isEmail && (
            <aside className={s.rail}>
              <DigestSidebar
                variant="rail"
                currentIssue={issueId}
                latestIssue={DIGEST_ISSUE.id}
                pastIssues={PAST_ISSUES}
                formatDate={(id) => formatIssueDate(id, 'short')}
                subscribed={signedIn ? topics : []}
                onSaveTopics={saveTopics}
                onOpenAllTopics={() => setTopicsOpen(true)}
                signedIn={signedIn}
                onAskSignIn={setAsk}
                pendingTopic={pendingTopic}
              />
            </aside>
          )}
        </div>
      </div>
    </>
  );
}

function StoryCard({
  story,
  asEmail,
  layout,
  following,
  onFollow,
  feedback,
  receiptAtTop,
  onPress,
  onUndo,
  thread,
}: {
  story: DigestStory;
  asEmail: boolean;
  /**
   * email: Figma's row (image beside the text, alternating sides). hero: the page's top story,
   * text beside a big picture. row: the page's other stories, picture beside the text.
   * On the page every story is shown in full.
   */
  layout: 'email' | 'hero' | 'row';
  following: boolean;
  onFollow: () => void;
  feedback: Feedback | undefined;
  receiptAtTop: boolean;
  onPress: (next: Feedback) => void;
  onUndo: () => void;
  /** The story's comments (web page only): Home's feed button and thread, reused. */
  thread: {
    comments: FeedComment[];
    open: boolean;
    onToggle: () => void;
    onAdd: (text: string, parentUid?: string) => void;
    isLiked: (uid: string) => boolean;
    onToggleLike: (uid: string) => void;
  };
}) {
  const receipt = feedback && (
    <div className={s.receipt} role="status">
      <span className={s.receiptMark}>
        <Check size={12} weight="bold" />
      </span>
      <span className={s.receiptText}>
        {feedback === 'more' ? 'You’ll get more stories like this' : 'You’ll get fewer stories like this'}
      </span>
      <button type="button" className={s.receiptUndo} onClick={onUndo}>
        Undo
      </button>
    </div>
  );

  const layoutClass = layout === 'hero' ? s.cardHero : story.imageSide === 'left' ? s.cardImageLeft : '';

  return (
    <article
      id={`story-${story.id}`}
      className={[s.card, !asEmail && s.cardWeb, layoutClass].filter(Boolean).join(' ')}
    >
      {receiptAtTop && receipt}

      {/* The feed card's team header: logo, the team (to its profile) and Follow beside it. */}
      {!asEmail && (
        <div className={`${nc.head} ${s.teamHead}`}>
          {TEAM_LOGOS[story.team] ? (
            <img className={nc.logo} src={TEAM_LOGOS[story.team]} alt="" />
          ) : (
            <div className={nc.logoFallback}>{getTeamLogoFallback(story.team)}</div>
          )}
          <a
            href="/prototypes/team-profile"
            target="_blank"
            rel="noopener noreferrer"
            className={`${nc.teamName} ${s.teamHeadName}`}
          >
            {story.team}
          </a>
          <span className={s.teamHeadFollow}>
            <FollowButton following={following} onClick={onFollow} name={story.team} size="xs" tertiary />
          </span>
        </div>
      )}

      <div className={s.cardTop}>
        <div className={s.cardText}>
          {story.topStory && <span className={s.topBadge}>🔥 Top story</span>}
          <h2 className={s.cardTitle}>{story.title}</h2>
          <p className={s.cardSummary}>{story.summary}</p>
        </div>
        <div className={s.cardImage}>
          <img src={story.image.src} alt="" />
        </div>
      </div>

      {/* What the email cuts off with Read More: the page shows it all. */}
      {!asEmail && (
        <div className={s.cardBody}>
          {story.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      )}

      {/* The page names every outlet that reported the story, as the news detail does. */}
      {!asEmail && (
        <p className={s.sources}>
          {story.sources.length === 1 ? 'Source' : 'Sources'}:{' '}
          {story.sources.map((source, i) => (
            <span key={source.url}>
              {i > 0 && <span aria-hidden> · </span>}
              <a href={source.url} target="_blank" rel="noopener noreferrer" className={s.sourceLink}>
                {source.name}
              </a>
            </span>
          ))}
        </p>
      )}

      <div className={s.cardFooter}>
        {asEmail && (
          <a href={`?story=${story.id}`} className={s.readSource}>
            Read More
          </a>
        )}
        <div className={s.feedback}>
          {asEmail ? (
            // In the email these are links: the page they open records the press.
            <>
              <FeedbackButton kind="more" href={`?story=${story.id}&feedback=more`} />
              <FeedbackButton kind="less" href={`?story=${story.id}&feedback=less`} />
            </>
          ) : (
            <>
              <FeedbackButton kind="more" active={feedback === 'more'} onClick={() => onPress('more')} />
              <FeedbackButton kind="less" active={feedback === 'less'} onClick={() => onPress('less')} />
            </>
          )}
        </div>
        {!asEmail && (
          <div className={s.cardActions}>
            {/* The feed card's Comments item: count + toggle for the thread under the story. */}
            <CommentButton count={thread.comments.length} open={thread.open} onToggle={thread.onToggle} />
            <ShareMenu variant="modal" url={`/prototypes/digest-web?story=${story.id}`} />
          </div>
        )}
      </div>

      {!receiptAtTop && receipt}

      {!asEmail && thread.open && (
        <CommentsThread
          comments={thread.comments}
          onAddComment={thread.onAdd}
          isCommentLiked={thread.isLiked}
          onToggleCommentLike={thread.onToggleLike}
        />
      )}
    </article>
  );
}

/** "9 November 2026", or "9 Nov 2026" for the Past issues list. */
const formatIssueDate = (id: string, size: 'long' | 'short' = 'long') =>
  new Date(`${id}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: size,
    year: 'numeric',
  });

/** Mock archive, newest first: each issue's date and its top story. The first is this week's. */
const PAST_ISSUES: PastIssue[] = [
  { id: DIGEST_ISSUE.id, lead: DIGEST_STORIES[0].title },
  { id: '2026-11-02', lead: 'Filecoin Onchain Cloud opens to the first paying customers' },
  { id: '2026-10-26', lead: 'Optimism ships fault proofs on every OP Stack chain' },
  { id: '2026-10-19', lead: 'Lattice Compute raises a seed round for verifiable GPU markets' },
  { id: '2026-10-12', lead: 'Starknet cuts fees tenfold after its v0.14 upgrade' },
];

/** The digest is weekly: the next issue is seven days after this one ("Monday, 16 November"). */
const NEXT_ISSUE_DATE = (() => {
  const next = new Date(`${DIGEST_ISSUE.id}T12:00:00`);
  next.setDate(next.getDate() + 7);
  return next.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
})();

/** The reader's team, which "Send us your team news" posts as (mock viewer, as on Home). */
const VIEWER_TEAM = { uid: 'protocol-labs', name: 'Protocol Labs' };

/** Seed like counts for the forum posts (mock). */
const FORUM_LIKES: Record<string, number> = { 'retrieval-latency': 12, 'cross-chain': 7 };

/** A digest forum post in the shape Home's forum modal reads (newsfeed-v0 `ForumPost`). */
const toForumPost = (post: DigestForumPost): ForumPost => ({
  uid: post.id,
  author: post.author,
  role: post.role,
  memberUid: post.id,
  title: post.title,
  body: post.body.join('\n\n'),
  category: post.category,
  focusArea: '',
  createdAt: post.createdAt,
  tags: post.tags,
  views: post.views,
  forumUrl: '/forum',
});

/** Each story team's logo, a square mark that reads on white. Filecoin Foundation uses the
 *  app's own Filecoin icon; the rest are drawn marks (the network CDN only has white wordmarks
 *  for the dark islands map, which vanish here). */
const TEAM_LOGOS: Record<string, string> = {
  'Proprio Labs': logoProprio.src,
  Starknet: logoStarknet.src,
  Optimism: logoOptimism.src,
  'Lattice Compute': logoLattice.src,
  'Filecoin Foundation': '/icons/technology/filecoin.svg',
};

/** Section anchors (`story-<key>`), so a link can still land on a section. */
const FORUM_SECTION = 'forum-posts';
const NEWS_SECTION = 'network-news';
const EVENTS_SECTION = 'upcoming-events';

function FeedbackButton({
  kind,
  active = false,
  onClick,
  href,
}: {
  kind: Feedback;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const label = kind === 'more' ? 'More like this' : 'Less like this';
  const content = (
    <>
      {kind === 'more' ? (
        <span className={s.thumbBox}>
          <img src={thumbsUp.src} alt="" width={14} height={14} />
        </span>
      ) : (
        // Figma draws the down thumb as the up glyph group, flipped, inset 15.63% / 6.25%.
        <span className={`${s.thumbBox} ${s.thumbDown}`}>
          <img src={thumbsDown.src} alt="" />
        </span>
      )}
      {label}
    </>
  );

  if (href) {
    return (
      <a href={href} className={s.feedbackBtn}>
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={`${s.feedbackBtn} ${active ? s.feedbackBtnActive : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {content}
    </button>
  );
}
