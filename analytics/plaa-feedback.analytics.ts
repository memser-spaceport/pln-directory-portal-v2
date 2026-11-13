import { usePostHog } from 'posthog-js/react';
import { useCurrentUserStore } from '@/services/auth/store';

/**
 * PLAA Feedback Board analytics (§10).
 *
 * Separate from `feedback.analytics.ts`, which belongs to the Directory-wide
 * support widget. Same word, different product surface.
 *
 * Properties are exactly the ones listed in the PRD. No titles, bodies, item
 * ids or extra identifiers: the stream needs to know what members ask for, not
 * which item it was.
 */
export const PLAA_FEEDBACK_EVENTS = {
  BOARD_VIEWED: 'feedback_board_viewed',
  FORM_OPENED: 'feedback_form_opened',
  SUBMITTED: 'feedback_submitted',
  VOTED: 'feedback_voted',
  UNVOTED: 'feedback_unvoted',
  COMMENT_POSTED: 'feedback_comment_posted',
  STATUS_CHANGED: 'feedback_status_changed',
} as const;

export const usePlaaFeedbackAnalytics = () => {
  const postHog = usePostHog();

  const capture = (event: string, properties: Record<string, unknown>) => {
    try {
      if (!postHog?.capture) return;
      const user = useCurrentUserStore.getState().currentUser;
      postHog.capture(event, { ...properties, loggedInUserUid: user?.uid });
    } catch (error) {
      console.error('PLAA feedback analytics error:', error);
    }
  };

  return {
    onBoardViewed: (tab: string) => capture(PLAA_FEEDBACK_EVENTS.BOARD_VIEWED, { tab }),

    onFormOpened: (entry: 'header' | 'empty_state') => capture(PLAA_FEEDBACK_EVENTS.FORM_OPENED, { entry }),

    onSubmitted: (type: string, screenshotCount: number, hasLink: boolean, hasImportance: boolean) =>
      capture(PLAA_FEEDBACK_EVENTS.SUBMITTED, {
        type,
        screenshot_count: screenshotCount,
        has_link: hasLink,
        has_importance: hasImportance,
      }),

    onVoted: (itemType: string, itemStatus: string) =>
      capture(PLAA_FEEDBACK_EVENTS.VOTED, { item_type: itemType, item_status: itemStatus }),

    onUnvoted: (itemType: string, itemStatus: string) =>
      capture(PLAA_FEEDBACK_EVENTS.UNVOTED, { item_type: itemType, item_status: itemStatus }),

    onCommentPosted: (itemType: string) => capture(PLAA_FEEDBACK_EVENTS.COMMENT_POSTED, { item_type: itemType }),

    onStatusChanged: (fromStatus: string, toStatus: string, hasNote: boolean) =>
      capture(PLAA_FEEDBACK_EVENTS.STATUS_CHANGED, {
        from_status: fromStatus,
        to_status: toStatus,
        has_note: hasNote,
      }),
  };
};
