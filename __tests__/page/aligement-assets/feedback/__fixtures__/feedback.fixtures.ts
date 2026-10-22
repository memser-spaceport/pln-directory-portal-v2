import type { FeedbackComment, FeedbackItem, FeedbackStatus, FeedbackType } from '@/services/plaa/feedback/feedback.types';

/**
 * Fixtures, not live content. Tests assert rules — visibility, gating,
 * formatting, state changes — against these, never against production copy.
 */
export function item(overrides: Partial<FeedbackItem> = {}): FeedbackItem {
  return {
    id: overrides.id ?? '11111111-1111-1111-1111-111111111111',
    type: 'feature' as FeedbackType,
    title: 'Fixture item',
    description: 'A fixture description long enough to be realistic.',
    importance: null,
    link_url: null,
    screenshot_count: 0,
    status: 'under_review' as FeedbackStatus,
    status_changed_at: '2026-10-20T10:00:00.000Z',
    completed_at: null,
    created_at: '2026-10-19T10:00:00.000Z',
    is_public: true,
    author: { member_uid: 'member-a', display_name: 'Ada Lovelace' },
    vote_count: 3,
    has_voted: false,
    comment_count: 0,
    duplicate_of: null,
    ...overrides,
  };
}

export function comment(overrides: Partial<FeedbackComment> = {}): FeedbackComment {
  return {
    id: overrides.id ?? 'c1',
    author: { member_uid: 'member-b', display_name: 'Grace Hopper' },
    body: 'A fixture comment.',
    hidden: false,
    is_admin_author: false,
    created_at: '2026-10-20T11:00:00.000Z',
    ...overrides,
  };
}

export const emptyRoadmap = { under_review: [], todo: [], in_progress: [], completed: [] };
