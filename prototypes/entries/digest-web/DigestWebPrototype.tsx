'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { toast } from '@/components/core/ToastContainer';
import fb from '@/components/ui/FollowButton/FollowButton.module.scss';
import { Check } from '@phosphor-icons/react';

import { ShareMenu } from '../newsfeed-v0/ShareMenu';

import plLogo from './assets/pl-logo.png';
import thumbsDown from './assets/thumbs-down.svg';
import thumbsUp from './assets/thumbs-up.svg';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { DIGEST_FORUM_POSTS, DIGEST_ISSUE, DIGEST_STORIES, type DigestStory, type Feedback } from './mocks';

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
  const landed = !isEmail && landedStory && DIGEST_STORIES.some((x) => x.id === landedStory) ? landedStory : null;

  const [feedback, setFeedback] = useState<Record<string, Feedback | undefined>>(() =>
    landed && landedFeedback ? { [landed]: landedFeedback } : {},
  );
  // The landing receipt sits at the top of the card, where the scroll puts the reader's eye
  // (a full story is taller than a phone screen, so a receipt under the buttons is off-screen).
  // Once the reader presses on the page, it moves under the buttons they pressed.
  const [receiptAtTop, setReceiptAtTop] = useState<string | null>(landed && landedFeedback ? landed : null);
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

  // The section in view, for the contents column: the last section (a story, then the forum
  // posts) whose top has passed a line a third of the way down the screen.
  const [activeStory, setActiveStory] = useState<string | null>(DIGEST_STORIES[0].id);
  useEffect(() => {
    if (!mounted || isEmail) return;
    const sections = [...DIGEST_STORIES.map((x) => x.id), FORUM_SECTION];
    const onScroll = () => {
      const line = window.innerHeight / 3;
      let current = sections[0];
      for (const id of sections) {
        const el = document.getElementById(`story-${id}`);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActiveStory(current);
    };
    onScroll();
    // The page scrolls on body in portal-v2, not the document, so listen in the capture phase.
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', onScroll, { capture: true });
  }, [mounted, isEmail]);

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
            <div className={s.logoRow}>
              <img src={plLogo.src} alt="Protocol Labs" width={144} height={32} />
            </div>

            {/* Web only: which issue this is (Medium Daily Digest / Substack's dateline). */}
            {!isEmail && (
              <p className={s.issueLine}>
                Weekly digest · {ISSUE_DATE} · {DIGEST_STORIES.length} stories
              </p>
            )}

            <header className={s.intro}>
              <h1 className={s.greeting}>Hi {DIGEST_ISSUE.greetingName},</h1>
              <p className={s.introText}>
                {DIGEST_ISSUE.intro}{' '}
                <a href="#" className={s.introLink}>
                  Change topics
                </a>
              </p>
            </header>

            {/* Under 1100px there's no room beside the column: the contents sit here instead. */}
            {!isEmail && <Contents variant="inline" active={activeStory} />}

            <div className={s.spacer} />

            <div className={s.cards}>
              {DIGEST_STORIES.map((story, i) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  asEmail={isEmail}
                  lead={i === 0 && !isEmail}
                  following={followed.has(story.team)}
                  onFollow={() => toggleFollow(story.team)}
                  feedback={feedback[story.id]}
                  receiptAtTop={receiptAtTop === story.id}
                  onPress={(next) => press(story.id, next)}
                  onUndo={() => undo(story.id)}
                />
              ))}
            </div>

            <div className={s.spacer} />
            <div id={`story-${FORUM_SECTION}`} className={`${s.dividerRow} ${s.forumAnchor}`}>
              <span className={s.dividerLine} />
              <h2 className={s.dividerLabel}>Recent forum posts</h2>
              <span className={s.dividerLine} />
            </div>

            {DIGEST_FORUM_POSTS.map((post) => (
              <section key={post.id} className={s.post}>
                <div className={s.spacer} />
                <div className={s.byline}>
                  <img src={post.avatar.src} alt="" className={s.avatar} width={32} height={32} />
                  <span className={s.bylineName}>by {post.author}</span>
                  <span className={s.bylineRole}>· {post.role}</span>
                </div>
                <div className={s.postBody}>
                  <h3 className={s.postTitle}>{post.title}</h3>
                  {(isEmail ? post.body.slice(0, 1) : post.body).map((p) => (
                    <p key={p} className={s.postText}>
                      {p}
                    </p>
                  ))}
                  <a href="#" className={s.postLink}>
                    {isEmail ? 'Read More' : 'Reply in the forum'}
                  </a>
                </div>
              </section>
            ))}

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
                  <a href="#">Manage preferences</a>
                  <a href="#">Switch to weekly</a>
                  <a href="#">Unsubscribe</a>
                </nav>
              </div>
            </footer>
          </article>

          {/* Web only, 1100px and up: the contents as a sticky column on the right,
              marking the story in view. */}
          {!isEmail && (
            <aside className={s.rail}>
              <Contents variant="rail" active={activeStory} />
            </aside>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * "In this issue": every story is open in full, so the page is long. A numbered contents list
 * (Quartz / NYT "Latest") jumps to the story the reader came for. Inline under the greeting on
 * narrow screens; a sticky right-hand column with the story in view marked on wide ones.
 */
function Contents({ variant, active }: { variant: 'inline' | 'rail'; active: string | null }) {
  const rail = variant === 'rail';
  // Wide screens: a docs-style contents column (Mintlify / Codecademy / Obvious) — a small
  // label, titles on a thin track, the section in view marked on the track. It lists every
  // part of the page, so the forum posts are in it too.
  if (rail) {
    const items = [
      ...DIGEST_STORIES.map((x) => ({ id: x.id, label: x.title })),
      { id: FORUM_SECTION, label: 'Recent forum posts' },
    ];
    return (
      <nav className={s.contentsRail} aria-label="In this issue">
        <h2 className={s.railLabel}>In this issue</h2>
        <ol className={s.railList}>
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#story-${item.id}`}
                className={`${s.railItem} ${active === item.id ? s.railItemActive : ''}`}
                aria-current={active === item.id ? 'location' : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    );
  }
  return (
    <nav className={rail ? s.contentsRail : s.contents} aria-label="In this issue">
      <h2 className={s.contentsTitle}>In this issue</h2>
      <ol className={s.contentsList}>
        {DIGEST_STORIES.map((story, i) => (
          <li key={story.id}>
            <a
              href={`#story-${story.id}`}
              className={`${s.contentsRow} ${rail && active === story.id ? s.contentsRowActive : ''}`}
              aria-current={rail && active === story.id ? 'location' : undefined}
            >
              <span className={s.contentsNum}>{i + 1}</span>
              <span className={s.contentsText}>
                <span className={s.contentsHeadline}>{story.title}</span>
                <span className={s.contentsMeta}>{story.team}</span>
              </span>
              {!rail && <img src={story.image.src} alt="" className={s.contentsThumb} width={64} height={44} />}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StoryCard({
  story,
  asEmail,
  lead,
  following,
  onFollow,
  feedback,
  receiptAtTop,
  onPress,
  onUndo,
}: {
  story: DigestStory;
  asEmail: boolean;
  /** The first story on the web page: its image runs the card's full width, above the text. */
  lead: boolean;
  following: boolean;
  onFollow: () => void;
  feedback: Feedback | undefined;
  receiptAtTop: boolean;
  onPress: (next: Feedback) => void;
  onUndo: () => void;
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

  return (
    <article
      id={`story-${story.id}`}
      className={[s.card, !asEmail && s.cardWeb, lead ? s.cardLead : story.imageSide === 'left' ? s.cardImageLeft : '']
        .filter(Boolean)
        .join(' ')}
    >
      {receiptAtTop && receipt}

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
            {/* The homepage news card's compact follow (production FollowButton's classes and glyphs),
                labelled with the team because the card has no team header to sit beside. */}
            <button
              type="button"
              className={`${fb.compactBtn} ${following ? fb.compactFollowing : ''}`}
              aria-pressed={following}
              onClick={onFollow}
            >
              {following ? <FollowCheckIcon /> : <FollowPlusIcon />}
              {following ? `Following ${story.team}` : `Follow ${story.team}`}
            </button>
            <ShareMenu variant="modal" url={`/prototypes/digest-web?story=${story.id}`} />
          </div>
        )}
      </div>

      {!receiptAtTop && receipt}
    </article>
  );
}

const ISSUE_DATE = new Date(`${DIGEST_ISSUE.id}T12:00:00`).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** The digest is weekly: the next issue is seven days after this one ("Monday, 16 November"). */
const NEXT_ISSUE_DATE = (() => {
  const next = new Date(`${DIGEST_ISSUE.id}T12:00:00`);
  next.setDate(next.getDate() + 7);
  return next.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
})();

/** The contents column's key for the forum section (its anchor is `story-forum-posts`). */
const FORUM_SECTION = 'forum-posts';

/* Production FollowButton's own glyphs, copied (they aren't exported). */
const FollowPlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const FollowCheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M11.667 3.5 5.25 9.917 2.333 7"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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
