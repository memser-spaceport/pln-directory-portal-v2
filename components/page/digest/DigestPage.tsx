'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DIGEST_LINK_TYPES,
  digestPageFrom,
  useDigestAnalytics,
  type DigestLinkType,
  type DigestTopicsVia,
} from '@/analytics/digest.analytics';
import { isPrivyOAuthReturn } from '@/components/core/login/utils/privyOAuthReturn';
import { useCurrentUserStore } from '@/services/auth/store';
import type { DigestChoice, DigestIssue, DigestPageData } from '@/services/digest/digest.types';
import { useDigestChoices } from '@/services/digest/hooks/useDigestChoices';
import { useDigestFollows } from '@/services/digest/hooks/useDigestFollows';
import { useDigestTopics } from '@/services/digest/hooks/useDigestTopics';
import { feedQueryKeys } from '@/services/feed/constants';
import type { IFeedCommentCountsResponse } from '@/types/feed.types';

import { DigestForum } from './DigestForum';
import { DigestEvents } from './DigestEvents';
import { DigestHeader } from './DigestHeader';
import { DigestNetworkNews } from './DigestNetworkNews';
import { DigestCaughtUp } from './DigestIssueEnd';
import { DigestPostNews } from './DigestPostNews';
import { DigestSidebar } from './DigestSidebar';
import { DigestStoryCard } from './DigestStoryCard';
import { DigestTopicsModal } from './DigestTopicsModal';

import s from './DigestPage.module.scss';

type Props = {
  /** The link token, passed from the server page. Only sent in choice request bodies. */
  token: string;
  /** The past issue on show (`?issue=`, LAB-3294); undefined for the link's own issue. */
  issue?: string;
  data: DigestPageData;
  isLoggedIn: boolean;
};

const asChoice = (value: string | null): DigestChoice | null => (value === 'more' || value === 'less' ? value : null);

/**
 * One member's digest (LAB-3264; v2 open layout LAB-3287), ported from the digest-web prototype. Opened from the
 * email; the link token decides whose digest it is. A More / Less link's choice is saved here, after the page loads in
 * the browser, so a link scanner that fetches the page changes nothing. Follow, Comments and posting news act for the
 * signed-in member and send a signed-out reader to sign-in.
 */
export function DigestPage({ token, issue, data, isLoggedIn }: Props) {
  const searchParams = useSearchParams();
  const { choices, receipts, press, undo, land } = useDigestChoices(token, data.stories, issue);
  const analytics = useDigestAnalytics();
  const started = useRef(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const follows = useDigestFollows(data.stories);
  const topics = useDigestTopics(data.topics);
  const signedIn = isHydrated ? Boolean(currentUser) : undefined;
  // What the reader asked for before sign-in comes back in the address: `topics=open` (also the email's Change
  // topics) opens the modal, `topic=<slug>` ticks that chip in Add topics. Read once, on load.
  const [topicsOpen, setTopicsOpen] = useState(() => searchParams.get('topics') === 'open');
  const [pickOnReturn] = useState(() => searchParams.get('topic'));

  // Back to this page after sign-in: the link token stays in the address, plus `extra` to pick up where they were.
  const goToLogin = useCallback(
    (extra?: { key: 'topics' | 'topic'; value: string }) => {
      const url = new URL(window.location.href);
      if (extra) {
        url.searchParams.delete('topics');
        url.searchParams.delete('topic');
        url.searchParams.set(extra.key, extra.value);
      }
      router.push(`${url.pathname}${url.search}#login`, { scroll: false });
    },
    [router],
  );
  const signIn = useCallback(() => goToLogin(), [goToLogin]);
  const signInForTopics = useCallback(
    (via: DigestTopicsVia, extra: { key: 'topics' | 'topic'; value: string }) => {
      analytics.onTopicsSignInPrompted({ via });
      goToLogin(extra);
    },
    [analytics, goToLogin],
  );
  const openTopics = (via: 'see-all' | 'change-topics') => {
    if (signedIn === undefined) return;
    if (!signedIn) return signInForTopics(via, { key: 'topics', value: 'open' });
    analytics.onTopicsModalOpened({ via });
    setTopicsOpen(true);
  };

  useEffect(() => {
    if (signedIn === undefined) return;
    if (!signedIn) {
      // The email's Change topics lands signed out: sign in first, then the address opens the modal. Not on the way
      // back from Google or GitHub, which still carries `topics=open`: starting a sign-in again would throw away the
      // one that is finishing (LAB-3308).
      if (searchParams.get('topics') === 'open' && !isPrivyOAuthReturn()) {
        signInForTopics('email', { key: 'topics', value: 'open' });
      }
      return;
    }
    // Signed in: the intent is applied, so a reload doesn't repeat it. `null` state: see the __NA trap.
    const url = new URL(window.location.href);
    if (!url.searchParams.has('topics') && !url.searchParams.has('topic')) return;
    url.searchParams.delete('topics');
    url.searchParams.delete('topic');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    // Once the auth state is known; the address is read from the window, not from searchParams.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const topicsCard = {
    followed: topics.followed,
    suggested: topics.suggested,
    canSave: topics.canSave,
    signedIn,
    initialPick: pickOnReturn,
    onSave: (next: string[]) => topics.save(next, 'card'),
    onOpenAll: () => openTopics('see-all'),
    onSignIn: (slug: string) => signInForTopics('chip', { key: 'topic', value: slug }),
  };
  // Past issues open from this same link: the link's own issue without `issue`, any other with its send time.
  const issuesCard = {
    issues: data.issues,
    current: data.sentAt,
    hrefFor: (row: DigestIssue) =>
      `?t=${encodeURIComponent(token)}${row.isLinkIssue ? '' : `&issue=${encodeURIComponent(row.sentAt)}`}`,
  };

  useEffect(() => {
    // The page read already counted each story's comments: seed the feed's shared counts entry so Comments shows the
    // number without another request. Values already there (a comment just posted) win.
    queryClient.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), (old) => ({
      ...Object.fromEntries(data.stories.map((story) => [story.uid, story.commentCount])),
      ...old,
    }));
  }, [queryClient, data.stories]);

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
    <div className={`${s.page} ${s.pageWeb}`}>
      <div className={s.webLayout}>
        <article className={s.email}>
          <DigestHeader
            frequency={data.frequency}
            sentAt={data.sentAt}
            storyCount={data.stories.length}
            firstName={data.firstName}
            onChangeTopics={() => openTopics('change-topics')}
          />

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
                following={follows.isFollowing(story.teamUid)}
                onFollow={
                  isHydrated
                    ? () => (currentUser ? follows.toggle(story.teamUid, story.teamName) : signIn())
                    : undefined
                }
                onSignIn={signIn}
              />
            ))}
          </div>

          {data.networkNews.length > 0 && (
            <>
              <div className={s.spacer} />
              <DigestNetworkNews
                items={data.networkNews}
                onOpen={(item, position) =>
                  analytics.onNetworkNewsClicked({ newsId: item.uid, position, domain: item.domain })
                }
              />
            </>
          )}

          {data.events.items.length > 0 && (
            <>
              <div className={s.spacer} />
              <DigestEvents events={data.events.items} total={data.events.total} signedIn={signedIn} />
            </>
          )}

          {data.forumPosts.length > 0 && (
            <>
              <div className={s.spacer} />
              <DigestForum posts={data.forumPosts} signedIn={signedIn} />
            </>
          )}

          <DigestCaughtUp nextSendAt={data.nextSendAt} />

          {/* Under 1100px there's no room beside the column: the side cards close the page instead. */}
          <DigestSidebar variant="inline" topics={topicsCard} issues={issuesCard} />

          {data.isTeamMember && (
            <DigestPostNews openOnLoad={searchParams.get('postnews') === 'open'} onSignIn={signIn} />
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

        {/* 1100px and up: the side cards as a sticky column on the right. */}
        <aside className={s.rail}>
          <DigestSidebar variant="rail" topics={topicsCard} issues={issuesCard} />
        </aside>
      </div>

      {topicsOpen && signedIn && topics.canSave && (
        <DigestTopicsModal
          followed={topics.followed}
          canSave={topics.canSave}
          onClose={() => setTopicsOpen(false)}
          onSave={(next) => topics.save(next, 'modal')}
        />
      )}
    </div>
  );
}
