import { usePostHog } from 'posthog-js/react';
import { useCallback, useMemo } from 'react';
import { useCurrentUserStore } from '@/services/auth/store';
import { DIGEST_ANALYTICS_EVENTS, FORUM_ANALYTICS_EVENTS } from '@/utils/constants';
import type { DigestChoice, DigestFrequency } from '@/services/digest/digest.types';

/** How the email opened the page; `direct` for a link without a known `link_type`. */
export type DigestPageFrom =
  | 'email-more'
  | 'email-less'
  | 'email-story'
  | 'email-post'
  | 'email-post-news'
  | 'email-change-topics'
  | 'view-in-browser'
  | 'direct';

/** Where a topics action started (LAB-3289). */
export type DigestTopicsVia = 'chip' | 'see-all' | 'change-topics' | 'email';

/** `post_news` and `change_topics` (LAB-3290): the email's "Post your team news →" and "Change topics". */
export type DigestLinkType =
  | 'story'
  | 'read_more'
  | 'more'
  | 'less'
  | 'view_in_browser'
  | 'post'
  | 'post_news'
  | 'change_topics';

export const DIGEST_LINK_TYPES: readonly DigestLinkType[] = [
  'story',
  'read_more',
  'more',
  'less',
  'view_in_browser',
  'post',
  'post_news',
  'change_topics',
];

export function digestPageFrom(linkType: string | null): DigestPageFrom {
  switch (linkType) {
    case 'more':
      return 'email-more';
    case 'less':
      return 'email-less';
    case 'story':
    case 'read_more':
      return 'email-story';
    case 'post':
      return 'email-post';
    case 'post_news':
      return 'email-post-news';
    case 'change_topics':
      return 'email-change-topics';
    case 'view_in_browser':
      return 'view-in-browser';
    default:
      return 'direct';
  }
}

/**
 * Digest page events (LAB-3264). Params are built here from plain values, never from the URL as a whole, so
 * the link token can't end up in an event. `stripLoginParamsFromEvent` also drops `t` from every captured URL.
 */
export function useDigestAnalytics() {
  const posthog = usePostHog();

  const capture = useCallback(
    (name: string, params: Record<string, unknown>) => {
      try {
        const user = useCurrentUserStore.getState().currentUser;
        posthog?.capture?.(name, { ...params, loggedInUserUid: user?.uid, loggedInUserEmail: user?.email });
      } catch (error) {
        console.error(error);
      }
    },
    [posthog],
  );

  return useMemo(
    () => ({
      /** The email click, on the existing digest email events, so current dashboards keep counting it. */
      onEmailLinkClicked(params: {
        linkType: DigestLinkType;
        utmSource: string | null;
        position: string | null;
        newsId: string | null;
        topicId: string | null;
      }) {
        const isPost = params.linkType === 'post';
        capture(
          isPost ? FORUM_ANALYTICS_EVENTS.DIGEST_EMAIL_POST_CLICKED : FORUM_ANALYTICS_EVENTS.DIGEST_EMAIL_NEWS_CLICKED,
          {
            utmSource: params.utmSource,
            link_type: params.linkType,
            position: params.position,
            ...(isPost ? { topic_id: params.topicId } : { news_id: params.newsId }),
          },
        );
      },
      onPageViewed(params: { frequency: DigestFrequency; sentAt: string; from: DigestPageFrom; isLoggedIn: boolean }) {
        capture(DIGEST_ANALYTICS_EVENTS.ON_DIGEST_PAGE_VIEWED, {
          frequency: params.frequency,
          sent_at: params.sentAt,
          from: params.from,
          is_logged_in: params.isLoggedIn,
        });
      },
      onStoryRead(params: { newsId: string; position: number }) {
        capture(DIGEST_ANALYTICS_EVENTS.ON_DIGEST_STORY_READ, { news_id: params.newsId, position: params.position });
      },
      onChoiceClicked(params: { kind: DigestChoice; newsId: string; position: number; activeAfter: boolean }) {
        capture(
          params.kind === 'more'
            ? DIGEST_ANALYTICS_EVENTS.ON_DIGEST_MORE_CLICKED
            : DIGEST_ANALYTICS_EVENTS.ON_DIGEST_LESS_CLICKED,
          { news_id: params.newsId, position: params.position, active_after: params.activeAfter },
        );
      },
      onUndoClicked(params: { newsId: string; choiceReverted: DigestChoice; via: 'undo-button' | 'second-press' }) {
        capture(DIGEST_ANALYTICS_EVENTS.ON_DIGEST_UNDO_CLICKED, {
          news_id: params.newsId,
          choice_reverted: params.choiceReverted,
          via: params.via,
        });
      },
      onTopicsSaved(params: { surface: 'card' | 'modal'; added: number; removed: number; total: number }) {
        capture(DIGEST_ANALYTICS_EVENTS.ON_DIGEST_TOPICS_SAVED, params);
      },
      onTopicsModalOpened(params: { via: Exclude<DigestTopicsVia, 'chip'> }) {
        capture(DIGEST_ANALYTICS_EVENTS.ON_DIGEST_TOPICS_MODAL_OPENED, params);
      },
      onTopicsSignInPrompted(params: { via: DigestTopicsVia }) {
        capture(DIGEST_ANALYTICS_EVENTS.ON_DIGEST_TOPICS_SIGN_IN_PROMPTED, params);
      },
    }),
    [capture],
  );
}
