'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import {
  DIGEST_LINK_TYPES,
  digestPageFrom,
  useDigestAnalytics,
  type DigestLinkType,
} from '@/analytics/digest.analytics';
import type { DigestChoice, DigestPageData } from '@/services/digest/digest.types';
import { useDigestChoices } from '@/services/digest/hooks/useDigestChoices';

import { DigestForumPost } from './DigestForumPost';
import { DigestHeader } from './DigestHeader';
import { DigestStoryCard } from './DigestStoryCard';

import s from './DigestPage.module.scss';

type Props = {
  /** The link token, passed from the server page. Only sent in choice request bodies. */
  token: string;
  data: DigestPageData;
  isLoggedIn: boolean;
};

const asChoice = (value: string | null): DigestChoice | null => (value === 'more' || value === 'less' ? value : null);

/**
 * One member's digest (LAB-3264), ported from the digest-web prototype. Opened from the email; the link token
 * decides whose digest it is. A More / Less link's choice is saved here, after the page loads in the browser,
 * so a link scanner that fetches the page changes nothing.
 */
export function DigestPage({ token, data, isLoggedIn }: Props) {
  const searchParams = useSearchParams();
  const { choices, receipts, press, undo, land } = useDigestChoices(token, data.stories);
  const analytics = useDigestAnalytics();
  const started = useRef(false);

  useEffect(() => {
    // Once per page load, Strict Mode included (refs survive its remount).
    if (started.current) return;
    started.current = true;

    const hash = window.location.hash.slice(1);
    const linkType = searchParams.get('link_type');
    const landedStory = searchParams.get('story');
    const landedChoice = asChoice(searchParams.get('choice'));

    if (linkType && (DIGEST_LINK_TYPES as readonly string[]).includes(linkType)) {
      analytics.onEmailLinkClicked({
        linkType: linkType as DigestLinkType,
        utmSource: searchParams.get('utm_source'),
        position: searchParams.get('position'),
        newsId: landedStory ?? (hash.startsWith('story-') ? hash.slice('story-'.length) : null),
        topicId: hash.startsWith('post-') ? hash.slice('post-'.length) : null,
      });
    }
    analytics.onPageViewed({
      frequency: data.frequency,
      sentAt: data.sentAt,
      from: digestPageFrom(linkType ?? (landedChoice ? landedChoice : null)),
      isLoggedIn,
    });

    // Scroll only: no mark on the item. An id that isn't on the page leaves the page at the top.
    const target = /^(story|post)-/.test(hash) ? document.getElementById(hash) : null;
    const landing = landedStory && landedChoice && data.stories.some((story) => story.uid === landedStory);
    (target ?? (landing ? document.getElementById(`story-${landedStory}`) : null))?.scrollIntoView({
      block: 'start',
      behavior: 'instant',
    });

    if (landing) {
      void land(landedStory, landedChoice).then((ok) => {
        if (!ok) return;
        // Drop the choice from the address so a reload doesn't save again. `null` state: see the __NA trap.
        const url = new URL(window.location.href);
        url.searchParams.delete('story');
        url.searchParams.delete('choice');
        window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
      });
    }
    // Runs once for the landing only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPress = (uid: string, position: number, kind: DigestChoice) => {
    const previous = choices[uid];
    const next = press(uid, kind);
    if (previous === kind) {
      analytics.onUndoClicked({ newsId: uid, choiceReverted: kind, via: 'second-press' });
    } else {
      analytics.onChoiceClicked({ kind, newsId: uid, position, activeAfter: next === kind });
    }
  };

  const onUndo = (uid: string) => {
    const reverted = choices[uid];
    if (reverted) analytics.onUndoClicked({ newsId: uid, choiceReverted: reverted, via: 'undo-button' });
    undo(uid);
  };

  return (
    <div className={s.page}>
      <article className={s.email}>
        <DigestHeader frequency={data.frequency} sentAt={data.sentAt} />

        <div className={s.spacer} />

        <div className={s.cards}>
          {data.stories.map((story, index) => (
            <DigestStoryCard
              key={story.uid}
              story={story}
              index={index}
              choice={choices[story.uid] ?? null}
              receipt={receipts[story.uid]}
              onPress={(kind) => onPress(story.uid, story.position, kind)}
              onUndo={() => onUndo(story.uid)}
              onRead={() => analytics.onStoryRead({ newsId: story.uid, position: story.position })}
            />
          ))}
        </div>

        {data.forumPosts.length > 0 && (
          <>
            <div className={s.spacer} />
            <div className={s.dividerRow}>
              <span className={s.dividerLine} />
              <h2 className={s.dividerLabel}>Recent forum posts</h2>
              <span className={s.dividerLine} />
            </div>
            {data.forumPosts.map((post) => (
              <DigestForumPost key={post.tid} post={post} />
            ))}
          </>
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
            <nav className={s.legalLinks}>
              <a href="/settings/email" className={s.manageLink}>
                Manage preferences
              </a>
            </nav>
          </div>
        </footer>
      </article>
    </div>
  );
}
