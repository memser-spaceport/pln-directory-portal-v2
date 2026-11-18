'use client';

import { useState } from 'react';

import { CommentButton } from '@/components/page/home/TeamNews/components/NewsCard/components/CommentButton/CommentButton';
import nc from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import {
  FeedCommentsThread,
  feedThreadDomId,
} from '@/components/page/home/TeamNews/components/FeedCommentsThread/FeedCommentsThread';
import { NewsShareMenu } from '@/components/page/home/TeamNews/components/NewsShareMenu';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { FollowButton } from '@/components/ui/FollowButton';
import type { DigestChoice, DigestStory } from '@/services/digest/digest.types';
import type { DigestReceiptPlace } from '@/services/digest/hooks/useDigestChoices';

import { DigestFeedbackButtons } from './DigestFeedbackButtons';
import { DigestReceipt } from './DigestReceipt';

import s from './DigestPage.module.scss';

type Props = {
  story: DigestStory;
  /** Index on the page: 0 is the hero; after it, odd stories put the image on the left. */
  index: number;
  choice: DigestChoice | null;
  receipt: DigestReceiptPlace | undefined;
  onPress: (kind: DigestChoice) => void;
  onUndo: () => void;
  /** A source link was opened. */
  onRead: () => void;
  following: boolean;
  /** Undefined until the auth store hydrates: Follow then waits, like the feed's. */
  onFollow?: () => void;
  /** Sends a signed-out reader to sign-in from the comments thread. */
  onSignIn: () => void;
};

/**
 * One news story, open on the page (LAB-3287, the digest-web prototype's StoryCard): the feed card's team header
 * with Follow, the title and summary beside the image (a hero for the first story), the full text, the Sources line,
 * then More / Less like this beside Comments and Share. The comments open under the story, as on Home.
 */
export function DigestStoryCard({
  story,
  index,
  choice,
  receipt,
  onPress,
  onUndo,
  onRead,
  following,
  onFollow,
  onSignIn,
}: Props) {
  const [threadOpen, setThreadOpen] = useState(false);
  // A thread holding an unsettled comment refuses to collapse (NewsCardFull's rule).
  const [threadBusy, setThreadBusy] = useState(false);
  const confirmation = choice && receipt ? <DigestReceipt choice={choice} onUndo={onUndo} /> : null;
  const image = storyImage(story);
  const layout = index === 0 ? s.cardHero : index % 2 === 1 ? s.cardImageLeft : '';

  return (
    <article id={`story-${story.uid}`} className={[s.card, s.cardWeb, layout].filter(Boolean).join(' ')}>
      {receipt === 'top' && confirmation}

      <div className={`${nc.head} ${s.teamHead}`}>
        {story.teamLogoUrl ? (
          <img className={nc.logo} src={story.teamLogoUrl} alt="" loading="lazy" />
        ) : (
          <div className={nc.logoFallback}>{getTeamLogoFallback(story.teamName)}</div>
        )}
        <a
          href={`/teams/${story.teamUid}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${nc.teamName} ${s.teamHeadName}`}
        >
          {story.teamName}
        </a>
        {onFollow && (
          <span className={s.teamHeadFollow}>
            <FollowButton following={following} onClick={onFollow} name={story.teamName} size="compact" />
          </span>
        )}
      </div>

      <div className={s.cardTop}>
        <div className={s.cardText}>
          {story.isTopStory && <span className={s.topBadge}>🔥 Top story</span>}
          <h2 className={s.cardTitle}>{story.title}</h2>
          {story.summary && <p className={s.cardSummary}>{story.summary}</p>}
        </div>
        {image && (
          <div className={s.cardImage}>
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes={index === 0 ? '(max-width: 639px) 100vw, 380px' : '(max-width: 639px) 100vw, 216px'}
              alt=""
            />
          </div>
        )}
      </div>

      {story.contentHtml && <SafeHtml html={story.contentHtml} className={`${s.cardBody} ${s.html}`} />}

      {story.sources.length > 0 && (
        <p className={s.sources}>
          {story.sources.length === 1 ? 'Source' : 'Sources'}:{' '}
          {story.sources.map((source, i) => (
            <span key={source.url}>
              {i > 0 && <span aria-hidden> · </span>}
              <a href={source.url} target="_blank" rel="noopener noreferrer" className={s.sourceLink} onClick={onRead}>
                {source.domain || 'Source'}
              </a>
            </span>
          ))}
        </p>
      )}

      <div className={s.cardFooter}>
        <DigestFeedbackButtons choice={choice} onPress={onPress} />
        <div className={s.cardActions}>
          <CommentButton
            itemUid={story.uid}
            open={threadOpen}
            onToggle={() => {
              if (threadBusy && threadOpen) return;
              setThreadOpen((open) => !open);
            }}
            controls={feedThreadDomId(story.uid)}
          />
          <NewsShareMenu item={story} source="digest" variant="button" side="top" />
        </div>
      </div>

      {receipt === 'under' && confirmation}

      {/* Mount = expanded: the comments query keys off it. */}
      {threadOpen && (
        <FeedCommentsThread
          itemUid={story.uid}
          kind="news"
          source="digest"
          onSignIn={onSignIn}
          onBusyChange={setThreadBusy}
        />
      )}
    </article>
  );
}

function storyImage(story: DigestStory): { src: string; srcSet?: string } | null {
  const variants = story.image?.variants ?? [];
  if (variants.length > 0) {
    // Narrowest first; the hero shows about 380px wide on desktop, the rest 216px, full width on a phone.
    const fit = variants.find((v) => v.width >= 760) ?? variants[variants.length - 1];
    return { src: fit.url, srcSet: variants.map((v) => `${v.url} ${v.width}w`).join(', ') };
  }
  return story.imageUrl ? { src: story.imageUrl } : null;
}
