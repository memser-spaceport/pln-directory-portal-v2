import { renderHook } from '@testing-library/react';
import { usePlaaFeedbackAnalytics } from '@/analytics/plaa-feedback.analytics';

const capture = jest.fn<void, [string, Record<string, unknown>]>();
jest.mock('posthog-js/react', () => ({ usePostHog: () => ({ capture }) }));
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: { getState: () => ({ currentUser: { uid: 'member-1' } }) },
}));

const sent = () => capture.mock.calls.map(([event, properties]) => ({ event, keys: Object.keys(properties).sort() }));

describe('what the feedback events tell analytics', () => {
  beforeEach(() => capture.mockClear());

  it('sends each action with its own properties and the signed-in member, and nothing else', () => {
    const { result } = renderHook(() => usePlaaFeedbackAnalytics());

    result.current.onBoardViewed('roadmap');
    result.current.onFormOpened('header');
    result.current.onSubmitted('bug', 2, true, false);
    result.current.onVoted('feature', 'todo');
    result.current.onUnvoted('feature', 'todo');
    result.current.onCommentPosted('feature');
    result.current.onStatusChanged('todo', 'in_progress', true);

    expect(sent()).toEqual([
      { event: 'feedback_board_viewed', keys: ['loggedInUserUid', 'tab'] },
      { event: 'feedback_form_opened', keys: ['entry', 'loggedInUserUid'] },
      {
        event: 'feedback_submitted',
        keys: ['has_importance', 'has_link', 'loggedInUserUid', 'screenshot_count', 'type'],
      },
      { event: 'feedback_voted', keys: ['item_status', 'item_type', 'loggedInUserUid'] },
      { event: 'feedback_unvoted', keys: ['item_status', 'item_type', 'loggedInUserUid'] },
      { event: 'feedback_comment_posted', keys: ['item_type', 'loggedInUserUid'] },
      { event: 'feedback_status_changed', keys: ['from_status', 'has_note', 'loggedInUserUid', 'to_status'] },
    ]);
  });
});
