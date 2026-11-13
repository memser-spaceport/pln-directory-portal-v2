'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { toast } from '@/components/core/ToastContainer';
import { Check } from '@phosphor-icons/react';

import plLogo from './assets/pl-logo.png';
import thumbsDown from './assets/thumbs-down.svg';
import thumbsUp from './assets/thumbs-up.svg';
import topStoryBg from './assets/top-story-bg.png';
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

  useEffect(() => {
    if (!landed) return;
    // Scroll only: no highlight on the story.
    document.getElementById(`story-${landed}`)?.scrollIntoView({ block: 'start' });
    // Runs once for the landing only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className={s.page}>
      {/* Prototype-only switch: not part of the email or the page. */}
      <nav className={s.viewSwitch} aria-label="Prototype view">
        <a href="?view=email" className={isEmail ? s.viewSwitchActive : undefined}>
          Email
        </a>
        {/* The two ways the page is opened from the email. */}
        <a href="?story=starknet-l1&feedback=more" className={landed && landedFeedback ? s.viewSwitchActive : undefined}>
          From More / Less like this
        </a>
        <a href="?story=starknet-l1" className={landed && !landedFeedback ? s.viewSwitchActive : undefined}>
          From Read More
        </a>
      </nav>

      <article className={s.email}>
        <div className={s.logoRow}>
          <img src={plLogo.src} alt="Protocol Labs" width={144} height={32} />
        </div>

        <header className={s.intro}>
          <h1 className={s.greeting}>Hi {DIGEST_ISSUE.greetingName},</h1>
          <p className={s.introText}>
            {DIGEST_ISSUE.intro}{' '}
            <a href="#" className={s.introLink}>
              Change topics
            </a>
          </p>
        </header>

        <div className={s.spacer} />

        <div className={s.cards}>
          {DIGEST_STORIES.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              asEmail={isEmail}
              feedback={feedback[story.id]}
              receiptAtTop={receiptAtTop === story.id}
              onPress={(next) => press(story.id, next)}
              onUndo={() => undo(story.id)}
            />
          ))}
        </div>

        <div className={s.spacer} />
        <div className={s.dividerRow}>
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
    </div>
  );
}

function StoryCard({
  story,
  asEmail,
  feedback,
  receiptAtTop,
  onPress,
  onUndo,
}: {
  story: DigestStory;
  asEmail: boolean;
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
      className={[s.card, story.imageSide === 'left' ? s.cardImageLeft : '']
        .filter(Boolean)
        .join(' ')}
      style={story.topStory ? { ['--card-bg-image' as string]: `url(${topStoryBg.src})` } : undefined}
    >
      {story.topStory && <span aria-hidden className={s.cardBgImage} />}

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

      <div className={s.cardFooter}>
        {asEmail ? (
          <a href={`?story=${story.id}`} className={s.readSource}>
            Read More
          </a>
        ) : (
          <a href="#" className={s.readSource}>
            Read on {story.source}
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
      </div>

      {!receiptAtTop && receipt}
    </article>
  );
}

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
