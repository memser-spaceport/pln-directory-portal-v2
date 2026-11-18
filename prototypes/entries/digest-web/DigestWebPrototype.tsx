'use client';

import { useSearchParams } from 'next/navigation';
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
export default function DigestWebPrototype() {
  const params = useSearchParams();
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

  const [feedback, setFeedback] = useState<Record<string, Feedback | undefined>>(() =>
    landed && landedFeedback ? { [landed]: landedFeedback } : {},
  );
  // The landing receipt sits at the top of the card, where the scroll puts the reader's eye
  // (a full story is taller than a phone screen, so a receipt under the buttons is off-screen).
  // Once the reader presses on the page, it moves under the buttons they pressed.
  const [receiptAtTop, setReceiptAtTop] = useState<string | null>(landed && landedFeedback ? landed : null);
  // Story comments, as Home's feed holds them (mocked, this visit only): the thread opens
  // under the story from its Comments button, one story at a time or several, like the feed.
  const [comments, setComments] = useState<Record<string, FeedComment[]>>(DIGEST_COMMENTS);
  const [openThreads, setOpenThreads] = useState<Set<string>>(() => new Set());  const [likedComments, setLikedComments] = useState<Set<string>>(() => new Set());
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

  return (
    <>
      {/* Platform navigation on the web version only; the Email view is an inbox, not the platform. */}
      {mounted && !isEmail && (
        <>
          <PrototypeNavBar hasUnreadNews={false} newsHref="/home" eventsInMore />
          <PrototypeMobileNav hasUnreadNews={false} />
        </>
      )}
      <div className={`${s.page} ${isEmail ? '' : s.pageWeb}`}>
        {/* Prototype-only switch: not part of the email or the page. */}
        <nav className={s.viewSwitch} aria-label="Prototype view">
          <a href="?view=email" className={isEmail ? s.viewSwitchActive : undefined}>
            Email
          </a>
          {/* The two ways the page is opened from the email. */}
          <a
            href="?story=starknet-l1&feedback=more"
            className={landed && landedFeedback ? s.viewSwitchActive : undefined}
          >
            From More / Less like this
          </a>
          <a href="?story=starknet-l1" className={landed && !landedFeedback ? s.viewSwitchActive : undefined}>
            From Read More
          </a>
        </nav>

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
              <h1 className={s.greeting}>Hi {DIGEST_ISSUE.greetingName},</h1>
              <p className={s.introText}>
                {DIGEST_ISSUE.intro}{' '}
                {/* Opens the All topics modal, so the issue stays where it was (Anuj: "new tab or
                    modal"). In the email it's a link that lands on this page with the modal open. */}
                {isEmail ? (
                  <a href="?topics=open" className={s.introLink}>
                    Change topics
                  </a>
                ) : (
                  <button type="button" className={s.introLink} onClick={() => setTopicsOpen(true)}>
                    Change topics
                  </button>
                )}
              </p>
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
                  onFollow={() => toggleFollow(story.team)}
                  feedback={feedback[story.id]}
                  receiptAtTop={receiptAtTop === story.id}
                  onPress={(next) => press(story.id, next)}
                  onUndo={() => undo(story.id)}
                  thread={{
                    comments: comments[story.id] ?? [],
                    open: openThreads.has(story.id),
                    onToggle: () => toggleInSet(setOpenThreads, story.id),
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
              onOpenPost={setOpenPostId}
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
                subscribed={topics}
                onSaveTopics={saveTopics}
                onOpenAllTopics={() => setTopicsOpen(true)}
              />
            )}

            {/* The digest asks for content: on the page it opens the team profile's Post news
                modal; in the email it lands on the page with that modal open. */}
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
                  Post it here and it goes straight onto the network feed. The best of the week makes the next
                  digest.
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
                subscribed={topics}
                onSaveTopics={saveTopics}
                onOpenAllTopics={() => setTopicsOpen(true)}
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

  const layoutClass =
    layout === 'hero'
      ? s.cardHero
      : story.imageSide === 'left'
        ? s.cardImageLeft
        : '';

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
